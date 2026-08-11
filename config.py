from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    jiuwenclaw_ws_url: str = "ws://localhost:19000/ws"
    openclaw_ws_url: str = "ws://localhost:18789/ws"
    openclaw_gateway_token: str = ""           # OPENCLAW_GATEWAY_TOKEN — leave blank if none
    openclaw_session_key: str = "agent:main:main"  # OPENCLAW_SESSION_KEY
    openclaw_agent_id: str = ""                # Optional: specific agent ID to route to
    openclaw_model: str = ""                   # Optional: model override (e.g., "anthropic/claude-sonnet-4.5")
    ws_timeout: int = 1800  # seconds
    default_jiuwenclaw_mode: str = "agent.plan"  # agent.plan | agent.fast | team | code.plan | code.normal
    openjiuwen_url: str = "http://localhost:8080/agents/execute"
    openjiuwen_agent_id: str = "react_agent_id"
    openjiuwen_conv_id: str = "tripwise_demo_id"
    # Bind address: "0.0.0.0" listens on all interfaces (localhost + LAN);
    # "127.0.0.1" is localhost-only. The uvicorn log prints this value.
    host: str = "0.0.0.0"
    port: int = 3025

    # Default result counts for each planning step (user can override via Settings UI)
    default_num_destinations: int = 2
    default_num_flights: int = 2
    default_num_hotels: int = 2
    default_num_car_rentals: int = 2
    default_num_attractions: int = 2

    # UI options
    show_agent_timer: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
