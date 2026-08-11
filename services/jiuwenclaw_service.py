import asyncio
import json
import time
from typing import AsyncGenerator

import websockets

from config import settings


async def stream_jiuwenclaw(
        system_prompt: str, user_message: str, task: str, mode: str | None = None
) -> AsyncGenerator[dict, None]:
    """
    Connect to JiuwenClaw WebSocket and yield SSE-style event dicts.
    Status events: {event, payload}
    Terminal event: {_type: "done", data: str} or {_type: "error", message: str}
    """
    full_content = f"[Task: {task}]\n\n{system_prompt}\n\n---\n\n{user_message}"
    session_id = f"tripwise_{task}_{int(time.time())}"

    print(f"\n[Tripewise - JiuwenClaw] ── task={task!r}  session={session_id}")
    print(f"[Tripewise - JiuwenClaw] Connecting to {settings.jiuwenclaw_ws_url} ...")

    try:
        async with websockets.connect(settings.jiuwenclaw_ws_url) as ws:
            print(f"[Tripewise ✅ JiuwenClaw]: Connected")

            effective_mode = mode or settings.default_jiuwenclaw_mode
            msg_out = {
                "type": "req",
                "id": "req_postman_001",
                "method": "chat.send",
                "params": {"session_id": session_id, "content": full_content, "mode": effective_mode},
            }
            await ws.send(json.dumps(msg_out))
            print(f"[Tripewise → JiuwenClaw]: Sent chat.send (msg_out={msg_out})")

            chunks = []
            msg_count = 0

            # --- SCOPE FIX: Define these before the function that uses them ---
            delta_buf: list[str] = []  # aggregates chat.delta text for a single flushed print
            delta_raw_bytes = 0
            delta_start_num = 0  # Added to track message range

            deadline = asyncio.get_event_loop().time() + settings.ws_timeout

            def _flush_deltas():
                """Print one aggregated line for all buffered chat.delta chunks, then clear."""
                nonlocal delta_raw_bytes, delta_start_num
                if not delta_buf:
                    return

                agg = "".join(delta_buf)

                # Format message range: e.g., #59-87 or just #59 if only one message
                msg_range = f"#{delta_start_num}-{msg_count}" if delta_start_num != msg_count else f"#{msg_count}"

                print(
                    f"[Tripewise ← JiuwenClaw]: Received messages {msg_range} (total {delta_raw_bytes} bytes) "
                    f"evt='chat.delta' x{len(delta_buf)} → {agg!r}"
                )

                delta_buf.clear()
                delta_raw_bytes = 0
                delta_start_num = 0

            while True:
                remaining = deadline - asyncio.get_event_loop().time()

                if remaining <= 0:
                    _flush_deltas()
                    print(f"[Tripewise ⏱ JiuwenClaw]: Deadline reached. chunks={len(chunks)}")
                    yield {"_type": "error", "message": f"JiuwenClaw timeout after {settings.ws_timeout}s, increase WS_TIMEOUT in .env"}
                    return

                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
                except asyncio.TimeoutError:
                    _flush_deltas()
                    print(f"[Tripewise ⏱ JiuwenClaw]: asyncio.wait_for timed out. chunks={len(chunks)}")
                    yield {"_type": "error", "message": f"JiuwenClaw timeout after {settings.ws_timeout}s, increase WS_TIMEOUT in .env"}
                    return

                msg_count += 1

                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    _flush_deltas()
                    print(
                        f"[Tripewise ? JiuwenClaw]: Non-JSON message #{msg_count} ({len(raw)} bytes), appending as raw text chunk")
                    chunks.append(raw)
                    continue

                evt = msg.get("event") or msg.get("type") or ""
                payload = msg.get("payload") or {}

                # --- content extraction (use is not None so empty string is preserved) ---
                content: str | None = None
                for src, key in [
                    (payload, "content"),
                    (payload, "text"),
                    (msg, "content"),
                    (msg, "text"),
                ]:
                    val = src.get(key)
                    if val is not None:
                        content = val
                        break

                if evt == "chat.delta":
                    # Accumulate silently; print only when the delta run ends
                    if not delta_buf:
                        delta_start_num = msg_count
                    delta_buf.append(content or "")
                    delta_raw_bytes += len(raw)
                else:
                    # Non-delta event — flush any pending delta run first, then log this event
                    _flush_deltas()
                    preview = raw[:300] + ("..." if len(raw) > 300 else "")
                    print(f"[Tripewise ← JiuwenClaw]: Received message #{msg_count} ({len(raw)} bytes) evt={evt!r} {preview}")

                # Forward status event to frontend
                yield {"event": evt, "payload": payload}

                if evt == "chat.delta" and content:
                    chunks.append(content)

                # Terminal: final answer
                if evt == "chat.final":
                    _flush_deltas()
                    accumulated = "".join(chunks)
                    final_data = accumulated if accumulated else (content or "")
                    if not final_data:
                        print(f"[Tripewise ⚠️ JiuwenClaw]: final_data is empty! Full msg dump: {json.dumps(msg)}")
                    yield {"_type": "done", "data": final_data}
                    return

                # Other terminal signals
                terminal = {"agent.done", "done", "complete", "result"}
                is_terminal = evt in terminal or msg.get("done") or payload.get("done")
                if is_terminal:
                    _flush_deltas()
                    accumulated = "".join(chunks)
                    final_data = accumulated or content or raw
                    print(
                        f"[Tripewise ✅ JiuwenClaw]: Terminal event {evt!r}. Final data ({len(final_data)} chars): {final_data[:200]!r}{'...' if len(final_data) > 200 else ''}")
                    yield {"_type": "done", "data": final_data}
                    return

    except Exception as exc:
        print(f"[Tripewise ❌ JiuwenClaw]: Exception: {type(exc).__name__}: {exc}")
        yield {"_type": "error", "message": str(exc)}
