import asyncio
import threading

import anthropic
from config import settings


def get_claude_text(system_prompt: str, user_message: str) -> str:
    """Call Claude API with web search enabled and return the text response."""
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set.")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = {"role": "user", "content": user_message}
    print(f"[Tripwise → Claude]: Sent message: system_prompt={system_prompt}, user message={message}")
    response = client.messages.create(
        model="claude-haiku-4-20250514",
        max_tokens=4000,
        system=system_prompt,
        messages=[message],
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
    )

    print(f"[Tripwise ← Claude]: Received message (msg_out={response.content})")
    return "".join(
        block.text for block in response.content if block.type == "text"
    )


async def stream_claude(system_prompt: str, user_message: str):
    """
    Yield SSE-style event dicts from the Claude streaming API.
    Runs the sync Anthropic SDK in a background thread and bridges
    events back to the async caller via asyncio.Queue.
    """
    if not settings.anthropic_api_key:
        yield {"_type": "error", "message": "ANTHROPIC_API_KEY is not set."}
        return

    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def _producer():
        try:
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            message = {"role": "user", "content": user_message}
            print(f"[Tripwise → Claude]: Sent message: system_prompt={system_prompt}, user message={message}")
            with client.messages.stream(
                model="claude-haiku-4-20250514",
                max_tokens=4000,
                system=system_prompt,
                messages=[message],
                tools=[{"type": "web_search_20250305", "name": "web_search"}],
            ) as stream:
                for event in stream:
                    loop.call_soon_threadsafe(queue.put_nowait, ("event", event))
            loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
        except Exception as exc:
            loop.call_soon_threadsafe(queue.put_nowait, ("error", str(exc)))

    threading.Thread(target=_producer, daemon=True).start()

    chunks: list[str] = []
    current_tool_name: str | None = None
    current_tool_args = ""

    while True:
        kind, val = await queue.get()
        print(f"[Tripwise ← Claude]: Received message (kind={kind}, val={val})")

        if kind == "done":
            yield {"_type": "done", "data": "".join(chunks)}
            return

        if kind == "error":
            yield {"_type": "error", "message": val}
            return

        # kind == "event" — inspect the Anthropic SDK event object
        evt_type = getattr(val, "type", "")

        if evt_type == "content_block_start":
            cb = getattr(val, "content_block", None)
            if cb:
                cb_type = getattr(cb, "type", "")
                if cb_type in ("tool_use", "server_tool_use"):
                    current_tool_name = getattr(cb, "name", "tool")
                    current_tool_args = ""

        elif evt_type == "content_block_delta":
            delta = getattr(val, "delta", None)
            if delta:
                delta_type = getattr(delta, "type", "")
                if delta_type == "text_delta":
                    text = getattr(delta, "text", "")
                    if text:
                        chunks.append(text)
                        yield {"event": "chat.delta", "payload": {"content": text}}
                elif delta_type == "input_json_delta":
                    current_tool_args += getattr(delta, "partial_json", "")

        elif evt_type == "content_block_stop":
            if current_tool_name:
                yield {
                    "event": "chat.tool_call",
                    "payload": {
                        "tool_call": {
                            "name": current_tool_name,
                            "arguments": current_tool_args,
                        }
                    },
                }
                current_tool_name = None
                current_tool_args = ""
