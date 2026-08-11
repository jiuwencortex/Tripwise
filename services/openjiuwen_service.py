import json

import httpx
from config import settings


async def call_openjiuwen(system_prompt: str, user_message: str, task: str) -> str:
    """POST to OpenJiuwen REST agent and return text response."""
    full_message = f"[Task: {task}]\n\n{system_prompt}\n\n---\n\n{user_message}"

    json_to_send = {
        "agent_id": settings.openjiuwen_agent_id,
        "conversation_id": settings.openjiuwen_conv_id,
        "message": full_message,
    }
    print(f"[Tripwise → OpenJiuwen]: Sent message to agent (msg_out={full_message})")

    try:
        async with httpx.AsyncClient(timeout=settings.ws_timeout) as client:
            response = await client.post(settings.openjiuwen_url, json=json_to_send)
            response.raise_for_status()
            result = response.json()
            print(f"[TripWise ← OpenJiuwen]: Received message from agent (msg_in={result})")

            return (
            result.get("data")
            or result.get("output")
            or result.get("result")
            or result.get("message")
            or result.get("text")
            or result.get("content")
            or str(result)
        )

    except httpx.TimeoutException:
        print(f"[TripWise ⏱ OpenJiuwen]: Error - Request timed out after {settings.ws_timeout}s")
        raise Exception(f"OpenJiuwen timeout after {settings.ws_timeout}s, increase WS_TIMEOUT in .env")

    except httpx.HTTPStatusError as e:
        print(f"[TripWise ❌ OpenJiuwen]: Error - HTTP Status {e.response.status_code}")
        raise Exception(f"OpenJiuwen returned error: {e.response.status_code}")

    except Exception as e:
        print(f"[TripWise ❌ OpenJiuwen]: Error - {str(e)}")
        raise Exception(f"OpenJiuwen communication failure: {str(e)}")


async def stream_openjiuwen(system_prompt: str, user_message: str, task: str):
    """
    Yield SSE-style event dicts around the OpenJiuwen REST call.
    Since the API is not streaming, we emit status events before/after.
    """
    full_message = f"[Task: {task}]\n\n{system_prompt}\n\n---\n\n{user_message}"
    json_to_send = {
        "agent_id": settings.openjiuwen_agent_id,
        "conversation_id": settings.openjiuwen_conv_id,
        "message": full_message,
        }
    print(f"[Tripwise → OpenJiuwen]: Sent message to agent (msg_out={json_to_send})")

    yield {
        "event": "chat.agent_call",
        "payload": {
            "agent_call": {
                "name": "openjiuwen_agent",
                "arguments": full_message,
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ws_timeout) as client:
            response = await client.post(settings.openjiuwen_url, json=json_to_send)
            response.raise_for_status()
            result = response.json()

            print(f"[TripWise ← OpenJiuwen]: Received message from agent (msg_in={result})")

        text = (
            result.get("data")
            or result.get("output")
            or result.get("result")
            or result.get("message")
            or result.get("text")
            or result.get("content")
            or str(result)
        )

        #preview = text[:300] + ("..." if len(text) > 300 else "")
        yield {
            "event": "chat.agent_result",
            "payload": {"agent_name": "openjiuwen_agent", "result": text},
        }
        yield {"event": "chat.final", "payload": {"content": ""}}
        yield {"_type": "done", "data": text}

    except httpx.TimeoutException:
        print(f"[TripWise ⏱ OpenJiuwen]: Error - Request timed out after {settings.ws_timeout}s")
        yield {"_type": "error", "message": f"OpenJiuwen timeout after {settings.ws_timeout}s, increase WS_TIMEOUT in .env"}

    except httpx.HTTPStatusError as e:
        print(f"[TripWise ❌ OpenJiuwen]: Error - HTTP Status {e.response.status_code}")
        yield {"_type": "error", "message": f"OpenJiuwen returned error: {e.response.status_code}"}
    except Exception as e:
        print(f"[TripWise ❌ OpenJiuwen]: Error - {str(e)}")
        yield {"_type": "error", "message": f"OpenJiuwen communication failure: {str(e)}"}

