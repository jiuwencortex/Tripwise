import asyncio
import json
import time
import uuid
from typing import AsyncGenerator

import websockets

from config import settings

# ──────────────────────────────────────────────────────────────────────────────
# OpenClaw WebSocket service  —  gateway protocol v3
#
# Key differences vs. JiuwenClaw:
#   1. MANDATORY "connect" handshake must complete before any other call.
#   2. chat.send uses  "sessionKey" + "message" + "idempotencyKey"
#      (not session_id / content as in JiuwenClaw).
#   3. Streaming arrives as  event:"chat"  with  payload.state = "delta"|"final"|"error"
#      (not separate event-name strings like "chat.delta" / "chat.final").
#   4. Agent progress arrives as  event:"agent"  with
#      payload.stream = "assistant" | "tool" | "lifecycle".
#   5. Default gateway port: 18789  (JiuwenClaw uses 19000).
#
# Reference:
#   https://docs.openclaw.ai/gateway/protocol
# ──────────────────────────────────────────────────────────────────────────────


async def stream_openclaw(
        system_prompt: str,
        user_message: str,
        task: str,
        agent_id: str | None = None,
        model: str | None = None
) -> AsyncGenerator[dict, None]:
    """
    Connect to an OpenClaw gateway WebSocket and yield SSE-style event dicts.

    Status events : {event, payload}
    Terminal event: {_type: "done", data: str}  or  {_type: "error", message: str}

    Args:
        system_prompt: System instructions for the agent
        user_message: User's input message
        task: Task identifier (for logging and session naming)
        agent_id: Optional agent ID to route to (overrides config default)
        model: Optional model override (e.g., "anthropic/claude-sonnet-4.5")

    Wire-level flow
    ───────────────
    1.  Client  →  connect req  (with optional auth.token)
    2.  Server  →  hello-ok res  (or connect.challenge event in device-pairing mode)
    3.  Client  →  chat.send req  (sessionKey + message + idempotencyKey + optional agentId/model)
    4.  Server  →  chat.send ack res  (runId)
    5.  Server  →  event:"chat"  frames  (payload.state = "delta" | "final" | "error")
                   event:"agent" frames  (payload.stream = "assistant"|"tool"|"lifecycle")
    """
    full_content = f"[Task: {task}]\n\n{system_prompt}\n\n---\n\n{user_message}"
    session_key = settings.openclaw_session_key
    effective_agent_id = agent_id or settings.openclaw_agent_id
    effective_model = model or settings.openclaw_model
    connect_req_id = str(uuid.uuid4())
    chat_req_id = str(uuid.uuid4())
    idempotency_key = str(uuid.uuid4())

    print(f"\n[Tripewise - OpenClaw] ── task={task!r}  sessionKey={session_key!r}")
    print(f"[Tripewise - OpenClaw] Connecting to {settings.openclaw_ws_url} ...")

    try:
        async with websockets.connect(settings.openclaw_ws_url) as ws:
            print(f"[Tripewise ✅ OpenClaw]: Connected")

            # ── Step 1: connect handshake ──────────────────────────────────
            connect_params: dict = {
                "minProtocol": 3,
                "maxProtocol": 3,
                "client": {
                    "id": f"tripwise-python-{int(time.time())}",
                    "version": "1.0.0",
                    "platform": "python",
                    "mode": "operator",
                },
                "role": "operator",
                "scopes": ["operator.read", "operator.write"],
                "capabilities": [],
                "commands": [],
                "permissions": [],
            }
            if settings.openclaw_gateway_token:
                connect_params["auth"] = {"token": settings.openclaw_gateway_token}

            await ws.send(json.dumps({
                "type": "req",
                "id": connect_req_id,
                "method": "connect",
                "params": connect_params,
            }))
            print(f"[Tripewise → OpenClaw]: Sent connect "
                  f"(token={'set' if settings.openclaw_gateway_token else 'none'})")

            deadline = asyncio.get_event_loop().time() + settings.ws_timeout

            # Wait for hello-ok.  connect.challenge events are issued only in
            # device-pairing security mode; with token auth they are absent, but
            # we skip them gracefully if the server does send one.
            while True:
                remaining = deadline - asyncio.get_event_loop().time()
                if remaining <= 0:
                    yield {"_type": "error", "message": "OpenClaw connect handshake timed out"}
                    return
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=min(remaining, 15))
                except asyncio.TimeoutError:
                    yield {"_type": "error", "message": "OpenClaw connect handshake timed out"}
                    return

                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                # Challenge event — only in device-pairing mode; skip with token auth
                if msg.get("type") == "event" and msg.get("event") == "connect.challenge":
                    print(f"[Tripewise ← OpenClaw]: Got connect.challenge — token auth active, skipping")
                    continue

                # hello-ok / hello-err
                if msg.get("type") == "res" and msg.get("id") == connect_req_id:
                    if msg.get("ok"):
                        pl = msg.get("payload") or {}
                        print(f"[Tripewise ✅ OpenClaw]: hello-ok  "
                              f"connId={pl.get('connId','?')}  "
                              f"proto=v{pl.get('protocolVersion','?')}")
                        break
                    else:
                        err = msg.get("error") or msg.get("payload") or {}
                        yield {"_type": "error", "message": f"OpenClaw connect rejected: {err}"}
                        return

            # ── Step 2: send the chat message ─────────────────────────────
            chat_params = {
                "sessionKey": session_key,
                "message": full_content,
                "idempotencyKey": idempotency_key,
            }

            # Add optional parameters if provided
            if effective_agent_id:
                chat_params["agentId"] = effective_agent_id
            if effective_model:
                chat_params["model"] = effective_model

            await ws.send(json.dumps({
                "type": "req",
                "id": chat_req_id,
                "method": "chat.send",
                "params": chat_params,
            }))
            log_extras = []
            if effective_agent_id:
                log_extras.append(f"agentId={effective_agent_id!r}")
            if effective_model:
                log_extras.append(f"model={effective_model!r}")
            extras_str = "  " + "  ".join(log_extras) if log_extras else ""
            print(f"[Tripewise → OpenClaw]: Sent chat.send  sessionKey={session_key!r}{extras_str}")

            # ── Step 3: stream events ──────────────────────────────────────
            chunks: list[str] = []
            msg_count = 0

            # Delta log aggregation (mirrors jiuwenclaw_service pattern)
            delta_buf: list[str] = []
            delta_raw_bytes = 0
            delta_start_num = 0

            def _flush_deltas() -> None:
                nonlocal delta_raw_bytes, delta_start_num
                if not delta_buf:
                    return
                agg = "".join(delta_buf)
                rng = (f"#{delta_start_num}-{msg_count}"
                       if delta_start_num != msg_count else f"#{msg_count}")
                print(
                    f"[Tripewise ← OpenClaw]: Received messages {rng} "
                    f"(total {delta_raw_bytes} bytes) "
                    f"state='delta' x{len(delta_buf)} → {agg!r}"
                )
                delta_buf.clear()
                delta_raw_bytes = 0
                delta_start_num = 0

            while True:
                remaining = deadline - asyncio.get_event_loop().time()
                if remaining <= 0:
                    _flush_deltas()
                    yield {"_type": "error",
                           "message": f"OpenClaw timeout after {settings.ws_timeout}s "
                                      f"— increase WS_TIMEOUT in .env"}
                    return

                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
                except asyncio.TimeoutError:
                    _flush_deltas()
                    yield {"_type": "error",
                           "message": f"OpenClaw timeout after {settings.ws_timeout}s "
                                      f"— increase WS_TIMEOUT in .env"}
                    return

                msg_count += 1

                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    _flush_deltas()
                    print(f"[Tripewise ? OpenClaw]: Non-JSON #{msg_count} ({len(raw)} bytes)")
                    chunks.append(raw)
                    continue

                msg_type = msg.get("type", "")
                msg_event = msg.get("event", "")
                payload = msg.get("payload") or {}

                # ── chat.send acknowledgement ──────────────────────────────
                if msg_type == "res" and msg.get("id") == chat_req_id:
                    if not msg.get("ok"):
                        _flush_deltas()
                        err = msg.get("error") or payload
                        yield {"_type": "error", "message": f"OpenClaw chat.send rejected: {err}"}
                        return
                    print(f"[Tripewise ← OpenClaw]: chat.send ack  "
                          f"runId={payload.get('runId','?')!r}  "
                          f"status={payload.get('status','?')!r}")
                    continue

                # ── event:"chat"  (delta / final / error) ─────────────────
                # OpenClaw uses a single "chat" event name with payload.state,
                # NOT separate "chat.delta" / "chat.final" names like JiuwenClaw.
                if msg_event == "chat":
                    # Filter cross-session noise (gateway broadcasts to all operator clients)
                    evt_session = payload.get("sessionKey", "")
                    if evt_session and evt_session != session_key:
                        continue

                    state = payload.get("state", "")
                    content: str = payload.get("message") or payload.get("text") or ""

                    if state == "delta":
                        if not delta_buf:
                            delta_start_num = msg_count
                        delta_buf.append(content)
                        delta_raw_bytes += len(raw)
                        if content:
                            chunks.append(content)
                        # Map to the event name the frontend already understands
                        yield {"event": "chat.delta", "payload": payload}

                    elif state == "final":
                        _flush_deltas()
                        preview = raw[:300] + ("..." if len(raw) > 300 else "")
                        print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) "
                              f"state='final'  {preview}")
                        yield {"event": "chat.final", "payload": payload}
                        # Prefer accumulated deltas; fall back to message in final event
                        accumulated = "".join(chunks)
                        final_data = accumulated if accumulated else content
                        if not final_data:
                            print(f"[Tripewise ⚠️ OpenClaw]: final_data is empty! "
                                  f"Full msg: {json.dumps(msg)}")
                        yield {"_type": "done", "data": final_data}
                        return

                    elif state == "error":
                        _flush_deltas()
                        err_msg = content or "Unknown OpenClaw chat error"
                        print(f"[Tripewise ❌ OpenClaw]: chat error → {err_msg}")
                        yield {"_type": "error", "message": err_msg}
                        return

                    else:
                        _flush_deltas()
                        preview = raw[:300] + ("..." if len(raw) > 300 else "")
                        print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) "
                              f"evt='chat' state={state!r}  {preview}")
                        yield {"event": f"chat.{state}" if state else "chat", "payload": payload}

                # ── event:"agent"  (assistant / tool / lifecycle) ──────────
                elif msg_event == "agent":
                    stream = payload.get("stream", "")
                    phase = payload.get("phase", "")

                    if stream == "assistant":
                        # Parallel token stream from the model — already covered by
                        # chat.delta above; forward quietly for completeness.
                        yield {"event": "agent.assistant", "payload": payload}

                    elif stream == "lifecycle":
                        _flush_deltas()
                        preview = raw[:300] + ("..." if len(raw) > 300 else "")
                        print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) "
                              f"agent lifecycle phase={phase!r}  {preview}")
                        yield {"event": f"agent.{phase}" if phase else "agent.lifecycle",
                               "payload": payload}

                    elif stream == "tool":
                        _flush_deltas()
                        print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) agent.tool")
                        yield {"event": "agent.tool", "payload": payload}

                    else:
                        _flush_deltas()
                        preview = raw[:300] + ("..." if len(raw) > 300 else "")
                        print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) "
                              f"evt='agent' stream={stream!r}  {preview}")
                        yield {"event": "agent", "payload": payload}

                # ── heartbeats / presence — silently ignored ───────────────
                elif msg_event in ("tick", "presence", "health", "system-presence"):
                    pass

                # ── everything else ────────────────────────────────────────
                else:
                    _flush_deltas()
                    preview = raw[:300] + ("..." if len(raw) > 300 else "")
                    print(f"[Tripewise ← OpenClaw]: #{msg_count} ({len(raw)} bytes) "
                          f"type={msg_type!r} evt={msg_event!r}  {preview}")
                    if msg_type in ("event", "res"):
                        yield {"event": msg_event or msg_type, "payload": payload}

    except Exception as exc:
        print(f"[Tripewise ❌ OpenClaw]: Exception: {type(exc).__name__}: {exc}")
        yield {"_type": "error", "message": str(exc)}
