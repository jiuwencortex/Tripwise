import json
from typing import Optional, List

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.claude_service import get_claude_text, stream_claude
from services.debug_service import stream_debug
from services.jiuwenclaw_service import stream_jiuwenclaw
from services.openclaw_service import stream_openclaw
from services.openjiuwen_service import call_openjiuwen, stream_openjiuwen
from utils.prompts import build_system_prompt

router = APIRouter(prefix="/api/travel")


class TravelRequest(BaseModel):
    task: str
    serverMode: Optional[str] = "jiuwenclaw"
    jiuwenclaw_mode: Optional[str] = None  # agent.plan | agent.fast | team | code.plan | code.normal
    openclaw_agent_id: Optional[str] = None  # Optional: specific OpenClaw agent to route to
    openclaw_model: Optional[str] = None     # Optional: model override (e.g., "anthropic/claude-sonnet-4.5")
    # Travel context (profile, budget, preferences, selections)
    context: str = ""
    # Task-specific parameters used to build the server-side prompt
    currency: Optional[str] = "USD"
    dest_name: Optional[str] = ""
    num_days: Optional[int] = 7
    selected_attractions: Optional[List[dict]] = []
    payload: Optional[dict] = None
    # User-overrideable result counts (fall back to DEFAULT_NUM_X in .env)
    num_destinations: Optional[int] = None
    num_flights: Optional[int] = None
    num_hotels: Optional[int] = None
    num_car_rentals: Optional[int] = None
    num_attractions: Optional[int] = None


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj)}\n\n"


def _build_user_message(req: TravelRequest) -> str:
    msg = req.context
    if req.task == "itinerary" and req.selected_attractions:
        msg += f"\nSelected attractions: {json.dumps(req.selected_attractions)}"
    return msg


@router.post("/stream")
async def stream_travel(req: TravelRequest):
    """
    SSE endpoint: streams AI backend events back to the browser.
    The frontend listens for:
      - {event, payload}         → status update (spinner / log)
      - {_type:"done", data}     → final text to parse as JSON
      - {_type:"error", message} → error to display
    """
    system_prompt = build_system_prompt(
        task=req.task,
        currency=req.currency or "USD",
        dest_name=req.dest_name or "",
        num_days=req.num_days or 7,
        num_destinations=req.num_destinations,
        num_flights=req.num_flights,
        num_hotels=req.num_hotels,
        num_car_rentals=req.num_car_rentals,
        num_attractions=req.num_attractions,
    )
    user_message = _build_user_message(req)

    async def generator():
        yield _sse({"event": "connection.start", "payload": {"status": "connecting"}})

        mode = req.serverMode or "claude"

        try:
            if mode == "jiuwenclaw":
                async for evt in stream_jiuwenclaw(system_prompt, user_message, req.task, req.jiuwenclaw_mode):
                    yield _sse(evt)
                    if evt.get("_type") in ("done", "error"):
                        return

            elif mode == "openclaw":
                async for evt in stream_openclaw(
                    system_prompt, user_message, req.task,
                    agent_id=req.openclaw_agent_id,
                    model=req.openclaw_model
                ):
                    yield _sse(evt)
                    if evt.get("_type") in ("done", "error"):
                        return

            elif mode == "openjiuwen":
                async for evt in stream_openjiuwen(system_prompt, user_message, req.task):
                    yield _sse(evt)
                    if evt.get("_type") in ("done", "error"):
                        return

            elif mode == "debug":
                async for evt in stream_debug(system_prompt, user_message, req.task):
                    yield _sse(evt)
                    if evt.get("_type") in ("done", "error"):
                        return

            else:  # claude (default)
                async for evt in stream_claude(system_prompt, user_message):
                    yield _sse(evt)
                    if evt.get("_type") in ("done", "error"):
                        return

        except Exception as exc:
            yield _sse({"_type": "error", "message": str(exc)})

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("")
async def travel_non_streaming(req: TravelRequest):
    """Non-streaming fallback. Returns {ok, task, mode, data}."""
    system_prompt = build_system_prompt(
        task=req.task,
        currency=req.currency or "USD",
        dest_name=req.dest_name or "",
        num_days=req.num_days or 7,
        num_destinations=req.num_destinations,
        num_flights=req.num_flights,
        num_hotels=req.num_hotels,
        num_car_rentals=req.num_car_rentals,
        num_attractions=req.num_attractions,
    )
    user_message = _build_user_message(req)
    mode = req.serverMode or "claude"

    try:
        if mode == "jiuwenclaw":
            async for evt in stream_jiuwenclaw(system_prompt, user_message, req.task, req.jiuwenclaw_mode):
                if evt.get("_type") == "done":
                    return {"ok": True, "task": req.task, "mode": mode, "data": evt.get("data", "")}
                if evt.get("_type") == "error":
                    return {"ok": False, "error": evt.get("message")}
            return {"ok": False, "error": "No response from JiuwenClaw"}

        elif mode == "openclaw":
            async for evt in stream_openclaw(
                system_prompt, user_message, req.task,
                agent_id=req.openclaw_agent_id,
                model=req.openclaw_model
            ):
                if evt.get("_type") == "done":
                    return {"ok": True, "task": req.task, "mode": mode, "data": evt.get("data", "")}
                if evt.get("_type") == "error":
                    return {"ok": False, "error": evt.get("message")}
            return {"ok": False, "error": "No response from OpenClaw"}

        elif mode == "openjiuwen":
            try:
                text = await call_openjiuwen(system_prompt, user_message, req.task)
                return {"ok": True, "task": req.task, "mode": mode, "data": text}
            except Exception as e:
                return {"ok": False, "error": str(e)}

        elif mode == "debug":
            async for evt in stream_debug(system_prompt, user_message, req.task):
                if evt.get("_type") == "done":
                    return {"ok": True, "task": req.task, "mode": mode, "data": evt.get("data", "")}
                if evt.get("_type") == "error":
                    return {"ok": False, "error": evt.get("message")}
            return {"ok": False, "error": "No response from debug service"}

        else:
            import asyncio
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(None, get_claude_text, system_prompt, user_message)
            return {"ok": True, "task": req.task, "mode": mode, "data": text}

    except Exception as exc:
        return {"ok": False, "error": str(exc)}

