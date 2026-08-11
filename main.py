import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from routers.travel import router as travel_router

app = FastAPI(title="Tripwise", version="1.0.0", description="Multi-Agent Travel Planner — Python/FastAPI port")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(travel_router)

# Serve static assets (logo image, etc.)
_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


@app.get("/api/config")
async def get_config():
    return {
        "show_agent_timer": settings.show_agent_timer,
        "jiuwenclaw_mode": settings.default_jiuwenclaw_mode,
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "claude_key_set": bool(settings.anthropic_api_key),
        "jiuwenclaw_ws": settings.jiuwenclaw_ws_url,
        "openjiuwen_url": settings.openjiuwen_url,
    }


@app.get("/")
async def index():
    html_path = os.path.join(_static_dir, "index.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"message": "Tripwise Python API — see /docs for Swagger UI"}


if __name__ == "__main__":
    import uvicorn
    import socket

    # Get local IP address
    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "127.0.0.1"

    print("\n" + "="*60)
    print("🚀 Tripwise Travel Planner Starting...")
    print("="*60)
    if settings.host in ("0.0.0.0", "::"):
        print(f"\n📍 Server accessible at:")
        print(f"   • Local:   http://localhost:{settings.port}")
        print(f"   • Network: http://{local_ip}:{settings.port}")
        print(f"\n💡 Open http://localhost:{settings.port} in your browser — "
              f"'{settings.host}' in the uvicorn log is the bind address, not a URL to open.")
    else:
        print(f"\n📍 Server accessible at:")
        print(f"   • Local:   http://localhost:{settings.port}")
    print("="*60 + "\n")

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
