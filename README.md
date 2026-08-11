# TripWise — AI-Powered Trip Planning Demo

TripWise is a full-stack demo application that walks a user through every step of planning a trip — from traveler profile to a day-by-day itinerary — by calling an AI backend at each stage. The project is designed to showcase **five interchangeable AI backends** (Claude, JiuwenClaw, OpenClaw, OpenJiuwen, and Debug) behind a single, polished browser UI.

> **Note:** Claude and OpenClaw backends are currently **disabled** as their integration is not yet finalized. Active backends: **JiuwenClaw**, **OpenJiuwen**, and **Debug**.

## Table of Contents

- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [What It Does](#what-it-does)
- [Architecture Overview](#architecture-overview)
- [Backend](#backend)
  - [Services](#services--the-ai-backends-are-the-brain)
  - [Configuration](#configuration--configpy--env)
- [Frontend](#frontend)
  - [Phase System](#phase-system)
  - [Feature Modules](#feature-modules)
- [Running Locally](#running-locally)
- [API Endpoints](#api-endpoints)
- [External APIs Used](#external-apis-used)
- [Extending TripWise](#extending-tripwise)
- [Troubleshooting](#troubleshooting)
- [Project File Map](#project-file-map)

---

## Quick Start

```bash
cd Tripwise
cp .env.example .env
uv sync
uv run main.py
```

Visit `http://localhost:3025` and select **Debug** mode for instant testing with mock data, or configure an AI backend in `.env` for real trip planning.

---

## Key Features

- **5 Interchangeable AI Backends** - Architected to support Claude, JiuwenClaw, OpenClaw, OpenJiuwen, and Debug mode (currently: **JiuwenClaw**, **OpenJiuwen**, and **Debug** active)
- **Zero Build Step** - Pure vanilla JavaScript SPA (39 modular files, no bundler required)
- **Real-Time Streaming** - Server-Sent Events (SSE) for live agent status and token-by-token responses
- **Complete Trip Planning** - Destinations → Flights → Hotels → Car Rentals → Attractions → Day-by-day itinerary
- **Rich Feature Set** - Interactive map, budget tracking, weather forecasts, currency conversion, packing lists, countdown timers
- **Offline Development** - Debug mode with realistic mock data (no API keys needed)
- **Production Ready** - Clean architecture, typed configs (Pydantic), comprehensive error handling

---

## What It Does

The user fills in a short wizard (who is traveling, budget, dates, interests). From that point on, each planning step is handled by the AI:

1. Suggest matching **destinations**
2. Find **flight** options to the chosen destination
3. Find **hotel** options
4. Find **car rental** options
5. Pick **attractions and activities**
6. Generate a detailed **day-by-day itinerary**
7. Render a **summary page** with map, budget breakdown, packing list, weather, currency rate, and share/print options

Every step returns structured JSON that the frontend renders as selectable cards. The user can skip any step (e.g. "I'll arrange flights myself") and the workflow adjusts accordingly.

---

## Architecture Overview

```
Browser (Vanilla JS SPA)
        │
        │  HTTP POST → SSE stream
        ▼
FastAPI backend (Python)  ── port 3025
        │
        ├── Claude service      (Anthropic API, claude-haiku-4 + web_search)
        ├── JiuwenClaw service  (local WebSocket agent  ws://localhost:19000/ws)
        ├── OpenClaw service    (local WebSocket gateway ws://localhost:18789/ws)
        ├── OpenJiuwen service  (local REST agent        http://localhost:8080)
        └── Debug service       (mock data for testing — no external calls)
```

The backend exposes a single endpoint: `POST /api/travel/stream`. It accepts the current trip context and the task name, calls the selected AI backend, and streams the response back as **Server-Sent Events (SSE)**. The frontend consumes the stream, shows live agent status messages, and when the stream ends it parses the final JSON payload to update the UI.

All five backends are fully interchangeable. Switching between them is a single dropdown in the UI; the prompt, context, and expected response format are identical regardless of which backend processes the request.

### Data Flow

```
User fills wizard
       ↓
Frontend state (S) — tracks all inputs + selections
       ↓
Task launcher (e.g., findFlights)
       ↓
POST /api/travel/stream {task, serverMode, context, ...}
       ↓
Router builds system_prompt + user_message
       ↓
Delegate to selected service:
       ├─→ claude_service.py    → Anthropic API → streaming tokens
       ├─→ jiuwenclaw_service.py → WebSocket → chat.delta frames
       ├─→ openclaw_service.py   → Gateway WS → event:"chat" + state:"delta"
       ├─→ openjiuwen_service.py → HTTP POST → response stream
       └─→ debug_service.py      → In-memory → instant mock JSON
       ↓
Yield SSE events: {event, payload} ... {_type:"done", data:"<json>"}
       ↓
Frontend receives SSE stream
       ├─→ agent_status.js updates live log
       ├─→ agent_timer.js shows elapsed time
       └─→ On "done", json_parser.js extracts JSON
       ↓
Update state (S.destinations, S.flights, ...)
       ↓
render() → display as selectable cards
       ↓
User selects → stored in state S → included in next task's context
```

---

## Backend

### Entry point — `main.py`

FastAPI application. Mounts the `static/` directory, registers the `/api/travel` router, and starts Uvicorn on port 3025. In `TripwisePython` folder, run:

```
python main.py
```

### Router — `routers/travel.py`

Single route: `POST /api/travel/stream`

Reads `serverMode` from the request (`claude` / `jiuwenclaw` / `openclaw` / `openjiuwen` / `debug`), builds the prompt, delegates to the matching service, and forwards each yielded event as an SSE frame. Terminates on `_type: "done"` or `_type: "error"`.

### Services — The AI Backends Are the Brain

TripWise does not contain any travel knowledge itself. It is a thin orchestration layer. All the intelligence — recommending destinations, finding flights, generating itineraries — lives entirely in the AI backend. TripWise's only job is to:

1. Assemble the right **instructions** for the current task
2. Bundle in the **context** the AI needs (everything the user has entered and chosen so far)
3. Send both to whichever backend is selected
4. Parse the structured JSON that comes back and display it as cards

#### What TripWise sends to the AI

Every request to any backend is composed of exactly two parts:

**System prompt** (`utils/prompts.py`) — tells the AI what role to play and exactly which JSON schema to return. A different prompt is built for each task. For example, the `flights` prompt reads:

```
You are a flight search expert. Suggest 2 realistic flight options to the selected destination.
Use web search for current routes and pricing. Return ONLY a JSON array.
Each: { "airline": string, "route": string, "departTime": string, "arriveTime": string,
"duration": string, "stops": number, "price": number, "class": string, "pros": string }.
Price in USD.
```

**User message** (`utils/context_builder.py`) — a human-readable summary of everything the user has entered and selected up to this point. This is the "memory" passed to the AI on every call:

```
Traveler Profile: 2 adults, 1 child (age 5). Special needs: none. Departing from: Paris.
Budget: 2000 USD total. Dates: 2026-06-01 to 2026-06-03. Flexibility: ±1 week.
Preferences: Interests: Culture, Food. Style: Mid-range comfort. Priority: Best experience.
Selected Destination: Rome, Italy.
```

For the itinerary task, the list of selected attractions is also appended so the AI can schedule them into specific days.

The router (`routers/travel.py`) assembles both strings, then hands them off to the chosen service:

```python
system_prompt = build_system_prompt(task, currency, dest_name, num_days)
user_message  = build_context_text(data)   # profile + budget + prefs + all prior selections
# → delegate to stream_claude / stream_jiuwenclaw / stream_openjiuwen / ...
```

#### Claude (`services/claude_service.py`)

> ⚠️ **Currently Disabled** - Integration not finalized.

Calls the **Anthropic API** directly using the Python SDK with the `claude-haiku-4` model. The `web_search_20250305` tool is enabled, so Claude can perform live web searches during its reasoning — looking up real flight prices, real hotels, current weather, etc. — before composing its final JSON answer.

The service streams the response token by token. Each token is forwarded to the browser as a `chat.delta` SSE event so the user sees the text building live. When the stream closes, the accumulated text is yielded as `_type: "done"` and the frontend parses it.

#### JiuwenClaw (`services/jiuwenclaw_service.py`)

Connects to a **locally running JiuwenClaw agent** over a persistent WebSocket (`ws://localhost:19000/ws`). JiuwenClaw is an agent framework that can run multi-step reasoning internally — tool calls, sub-agents, memory, loops — all invisible to TripWise. TripWise simply sends a single `chat.send` message and streams back whatever the agent produces:

```
TripWise  →  {
  "method": "chat.send",
  "params": {
    "session_id": "tripwise_flights_1234567890",
    "content":    "[Task: flights]\n\n<system_prompt>\n\n---\n\n<user_message>"
  }
}

JiuwenClaw →  { "event": "chat.delta", "payload": { "content": "[\n  {\n    \"airline\"..." } }
               ... many more delta frames ...
JiuwenClaw →  { "event": "chat.final", "payload": { "content": "<complete JSON>" } }
```

The system prompt and user message are concatenated into the single `content` field, prefixed with `[Task: flights]` so the agent knows which task it is handling without needing a separate API parameter. The service accumulates all `chat.delta` frames silently and emits one summarised log line when the stream ends, avoiding hundreds of noisy console prints per response.

#### OpenJiuwen (`services/openjiuwen_service.py`)

Calls a **locally running OpenJiuwen agent** via HTTP POST to `http://localhost:8080/agents/execute`. OpenJiuwen is the broader agent studio platform that TripWise is itself a demo of. The same two strings (system prompt + user message) are sent as the request body; the agent processes them — potentially using tools, sub-agents, or multi-step workflows — and returns or streams the completed JSON response.

When setting up the OpenJiuwen backend, there are several points to pay attention to:

1. An agent needs to be created in OpenJiuwen (e.g. using the agent-studio frontend). Below is a system prompt that showed a good performance with Tripwise. It can be used "as is" or tweaked to user's preference:

```
You are a multi‑turn travel‑planning assistant. Your role is to understand the user’s requests, maintain context across the conversation, and apply the correct task‑specific instructions whenever they are provided. Task prompts will be supplied from outside and must be treated as the active instructions for that turn. When a task prompt is given, adopt it fully and use the user’s message as the contextual input for that task. Follow the task prompt exactly, including its required output format and constraints.

You have access to Tavily, which allows you to gather real‑world information when a task requires it. Tavily can search the web, extract structured content from links, explore websites, map their pages, and perform deeper research when needed. Use these capabilities only when the task prompt calls for real‑world data such as prices, schedules, weather, local details, or other up‑to‑date information.

Do not add commentary or text outside the required format. Do not mix instructions from different tasks. Maintain awareness of previous turns, including selected destinations, dates, budgets, or other relevant details, unless a new task prompt overrides them. If the user’s intent is unclear and no task prompt is provided, ask a concise clarifying question.
```

2. The agent needs to have access to a web search plugin (e.g. Tavily, which can be installed from Plugin Marketplace of Openjiuwen)

3. The agent's ID needs to be set in `.env` as OPENJIUWEN_AGENT_ID

4. In order to connect to the OpenJiuwen AI backend, Tripwise requires a Webhook Server to be up. It exposes OpenJiuwen workflows and agents as REST endpoints. In `agent-studio` folder, run:

```
python -m connect.adapters.channels.run webhook
```

5. Authentication to OpenJiuwen needs to be established via `http://localhost:8080/docs` endpoint. To do this in the web GUI:
- Open `http://localhost:8080/docs` in a browser
- Click `/auth/login/` and then `Try it out`
- Enter your OpenJiuwen username to "username" field ("password" can be anything), click `Execute`
- Verify in "Response body" that the login was successful
- Optional: in order to stay logged in indefinitely, re-run Webhook with `--token` and `--space-id` parameters that you received in the response body

#### OpenClaw (`services/openclaw_service.py`)

> ⚠️ **Currently Disabled** - Integration not finalized.

Connects to a **locally running OpenClaw gateway** over WebSocket (`ws://localhost:18789/ws`). OpenClaw is a next-generation agent framework with a standardized gateway protocol v3. Key differences from JiuwenClaw:

1. **Mandatory "connect" handshake** must complete before any other call
2. Uses `sessionKey` + `message` + `idempotencyKey` (not `session_id` / `content`)
3. Streaming arrives as `event:"chat"` with `payload.state = "delta"|"final"|"error"`
4. Agent progress arrives as `event:"agent"` with `payload.stream = "assistant"|"tool"|"lifecycle"`
5. Supports **agent routing** and **model overrides** per request

Configuration options:
- `OPENCLAW_GATEWAY_TOKEN` - Authentication token (leave blank if gateway auth is disabled)
- `OPENCLAW_SESSION_KEY` - Format: `"agent:<agentId>:<channelId>"` or `"main"` for default
- `OPENCLAW_AGENT_ID` - Specific agent to route to (optional)
- `OPENCLAW_MODEL` - Model override (e.g., `"anthropic/claude-sonnet-4.5"`)

Reference: https://docs.openclaw.ai/gateway/protocol

#### Debug (`services/debug_service.py`)

Returns **pre-canned mock data** immediately with no external API calls. Simulates the same SSE event flow as real services, so the frontend behaves identically. Perfect for:

- Testing the UI without API costs
- Developing offline
- Demonstrating the application without backend dependencies

Mock trip: Paris → Barcelona, 2 travelers (1 adult + 1 child), June 1-3 2026, USD budget. All planning steps return realistic sample data instantly.

#### What the AI is expected to return

Every backend must respond with a **raw JSON string** that matches the schema defined in the system prompt — no prose, no explanation, no markdown wrapper. For example, the `destinations` task expects:

```json
[
  {
    "name": "Rome",
    "country": "Italy",
    "description": "A city where ancient ruins meet vibrant street life.",
    "matchScore": 87,
    "budgetScore": 72,
    "weatherScore": 91,
    "estFlightCost": 320,
    "estHotelPerNight": 95,
    "highlights": ["Colosseum", "Vatican Museums", "Trastevere"]
  }
]
```

`utils/json_parser.py` extracts this from the raw text, stripping any markdown code fences the model may have added. The parsed array or object is stored in the frontend state (`S`) and immediately rendered as selectable cards.

#### Summary

| File | Backend | How it connects | Streaming protocol |
|------|---------|----------------|--------------------|
| `services/claude_service.py` | Anthropic Claude Haiku 4 + web_search | HTTPS (Anthropic SDK) | Token-by-token via SDK stream |
| `services/jiuwenclaw_service.py` | JiuwenClaw agent (local) | WebSocket `chat.send` | `chat.delta` → `chat.final` |
| `services/openclaw_service.py` | OpenClaw gateway (local) | WebSocket gateway protocol v3 | `event:"chat"` with `state:"delta"|"final"` |
| `services/openjiuwen_service.py` | OpenJiuwen agent (local) | HTTP POST | Response body / streaming |
| `services/debug_service.py` | Mock data (no external calls) | In-memory | Simulated SSE events |

All five implement the same Python async-generator contract: yield `{event, payload}` dicts for live status updates, then yield `{_type: "done", data: "<json>"}` as the terminal event.

#### Choosing a Backend

| Backend | Best For | Pros | Cons | Status |
|---------|----------|------|------|--------|
| **Claude** | Production use | Web search built-in, high quality, reliable | Requires API key, costs per request | ⚠️ **Disabled** |
| **JiuwenClaw** | Multi-step agent workflows | Advanced reasoning, tool usage, persistent memory | Requires local setup | ✅ **Active** |
| **OpenClaw** | Next-gen agent routing | Agent selection, model overrides, gateway architecture | Requires OpenClaw gateway running | ⚠️ **Disabled** |
| **OpenJiuwen** | Agent studio integration | Full OpenJiuwen platform features | Requires full agent studio setup | ✅ **Active** |
| **Debug** | Testing & development | Zero setup, instant responses, offline | Mock data only (not real results) | ✅ **Active** |

### Utilities

| File | Purpose |
|------|---------|
| `utils/prompts.py` | Builds task-specific system prompts. Each task (`destinations`, `flights`, `hotels`, `carrental`, `attractions`, `itinerary`) gets its own prompt with configurable result counts. |
| `utils/context_builder.py` | Formats the accumulated trip state (profile, budget, preferences, selections) into a readable string that is appended to every AI request. |
| `utils/json_parser.py` | Extracts the first JSON array or object from the AI's text response, stripping markdown code fences if present. |

### Configuration — `config.py` / `.env`

All tuneable values are in environment variables with sensible defaults. Copy `.env.example` to `.env` and configure:

#### API Keys & Endpoints

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required for Claude mode |
| `JIUWENCLAW_WS_URL` | `ws://localhost:19000/ws` | JiuwenClaw WebSocket |
| `DEFAULT_JIUWENCLAW_MODE` | `agent.plan` | Mode: `agent.plan`, `agent.fast`, `team`, `code.plan`, `code.normal` |
| `OPENCLAW_WS_URL` | `ws://localhost:18789/ws` | OpenClaw gateway WebSocket |
| `OPENCLAW_GATEWAY_TOKEN` | — | Auth token (leave blank if gateway auth disabled) |
| `OPENCLAW_SESSION_KEY` | `agent:main:main` | Format: `agent:<agentId>:<channelId>` or `main` |
| `OPENCLAW_AGENT_ID` | — | Optional: specific agent to route to |
| `OPENCLAW_MODEL` | — | Optional: model override (e.g., `anthropic/claude-sonnet-4.5`) |
| `OPENJIUWEN_URL` | `http://localhost:8080/agents/execute` | OpenJiuwen REST endpoint |
| `OPENJIUWEN_AGENT_ID` | `react_agent_id` | OpenJiuwen agent identifier |
| `OPENJIUWEN_CONV_ID` | `tripwise_demo_id` | OpenJiuwen conversation ID |

#### Server & UI Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3025` | HTTP server port |
| `WS_TIMEOUT` | `1800` | WebSocket timeout in seconds |
| `SHOW_AGENT_TIMER` | `true` | Show elapsed-time counter in UI |

#### Default Result Counts

User can override these in the Settings UI:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_NUM_DESTINATIONS` | `2` | How many destinations to suggest |
| `DEFAULT_NUM_FLIGHTS` | `2` | How many flights to suggest |
| `DEFAULT_NUM_HOTELS` | `2` | How many hotels to suggest |
| `DEFAULT_NUM_CAR_RENTALS` | `2` | How many car rentals to suggest |
| `DEFAULT_NUM_ATTRACTIONS` | `2` | How many attractions to suggest |

---

## Frontend

A single-page application written in plain JavaScript — no build step, no framework. `index.html` loads 39 modular JS files in dependency order; each file is self-contained and adds functions to the global scope.

### State

`state.js` holds the single global object `S`. Every piece of data — user inputs, AI results, UI flags — lives here. The entire UI is re-rendered from `S` on every state change by calling `render()`.

### Phase System

The app is divided into 10 phases (stored as `S.phase`). `main_renderer.js` dispatches to the correct renderer function based on the current phase.

| Phase | Screen | AI task? |
|-------|--------|----------|
| 0 | Welcome | — |
| 1 | Traveler profile | — |
| 2 | Budget & dates | — |
| 3 | Travel preferences | — |
| 4 | Destinations | `findDestinations()` |
| 5 | Flights | `findFlights()` |
| 6 | Hotels | `findHotels()` |
| 7 | Car rentals | `findCarRentals()` |
| 8 | Attractions | `findAttractions()` |
| 9 | Itinerary | `generateItinerary()` |
| 10 | Summary & map | — |

Each phase from 4 onward has a **skip option**: the user can click "No Flights →", "No Hotel →", or "No Car →" to navigate to the next screen without fetching data. The skipped screen opens in an empty state, shows an explanatory message and an "Anyway" button that triggers the real fetch if the user changes their mind.

### AI Communication — `api_call.js` / `task_launchers.js`

`task_launchers.js` exposes `findDestinations()`, `findFlights()`, `findHotels()`, `findCarRentals()`, `findAttractions()`, `generateItinerary()`. Each function:

1. Advances `S.phase` to the target screen
2. Calls `runTask(taskName, onSuccess, onError)`
3. `runTask` opens an SSE connection to the backend
4. Incoming `chat.delta` events accumulate in the last log entry (debounced, 1 s)
5. On `_type: "done"`, the JSON payload is parsed and stored in `S`
6. `render()` is called — results appear as selectable cards

### Agent Status & Monitoring

**`agent_status.js`** - Displays live agent activity in the right-hand events pane. Delta messages are accumulated and flushed after 1 second of silence to avoid flickering. All timestamps are shown in 24-hour format.

**`agent_timer.js`** - Shows elapsed time counter during AI processing. Can be toggled via `SHOW_AGENT_TIMER` environment variable.

### Feature Modules

| File | Feature |
|------|---------|
| `agent_timer.js` | Live elapsed-time counter during AI processing |
| `context_bar.js` | Persistent top bar showing selected destination / flight / hotel / dates + live budget meter |
| `budget_donut_chart.js` | SVG donut chart breaking down spend by category |
| `trip_map.js` | Leaflet map with colour-coded, day-numbered attraction pins and a hotel marker (geocoded via Nominatim) |
| `trip_health_score.js` | Animated 0–100 score across four dimensions: budget fit, activities, duration, weather |
| `itinerary_timeline_view.js` | Visual timeline rendering of the day-by-day itinerary |
| `packing_list.js` | Checklist modal with a "Full List" tab and an itinerary-aware "Pack by Day" tab |
| `departure_countdown.js` | Live countdown (days / hours / minutes) to departure |
| `local_time_live_clock.js` | Dual clock: home timezone and destination timezone, ticking live |
| `weather_fetch.js` | 14-day forecast via Open-Meteo |
| `currency_convert.js` | Live exchange rate via @fawazahmed0 currency API (CORS-safe jsDelivr CDN) |
| `dest_hero_image.js` | Destination hero image from Wikipedia REST API |
| `local_phrases.js` | Common phrases in the destination language (built-in lookup for 19 countries) |
| `save_load_trips.js` | Persist full trip state to / from `localStorage` |
| `share_trip_url.js` | Encode trip state into a URL hash for sharing |
| `copy_itinerary.js` | Copy itinerary as Markdown to clipboard |
| `whatsapp_email_share.js` | Share itinerary via WhatsApp or email |
| `voice_readout.js` | Text-to-speech narration of the trip summary |
| `confetti.js` | Confetti animation on itinerary completion |
| `settings_modal.js` | Configuration UI for backend selection and result count preferences |
| `expandable_cards.js` | Card expand/collapse animations and interactions |
| `constants.js` | Global constants and configuration values |
| `helpers.js` | Utility functions used across modules |
| `render_helpers.js` | Common rendering utilities for DOM manipulation |
| `navigation.js` | Phase navigation and routing logic |

---

## API Endpoints

The backend exposes the following REST endpoints:

### `POST /api/travel/stream`

Server-Sent Events (SSE) endpoint for streaming AI responses.

**Request body:**
```json
{
  "task": "destinations" | "flights" | "hotels" | "carrental" | "attractions" | "itinerary",
  "serverMode": "claude" | "jiuwenclaw" | "openclaw" | "openjiuwen" | "debug",
  "context": "string",
  "currency": "USD",
  "dest_name": "string",
  "num_days": 7,
  "jiuwenclaw_mode": "agent.plan" | "agent.fast" | "team" | "code.plan" | "code.normal",
  "openclaw_agent_id": "string (optional)",
  "openclaw_model": "string (optional)",
  "num_destinations": 2,
  "num_flights": 2,
  "num_hotels": 2,
  "num_car_rentals": 2,
  "num_attractions": 2
}
```

**Response:** SSE stream with events:
- `{event: "connection.start", payload: {...}}` - Connection established
- `{event: "chat.delta", payload: {content: "..."}}` - Streaming content
- `{_type: "done", data: "<json>"}` - Final JSON result
- `{_type: "error", message: "..."}` - Error occurred

### `POST /api/travel`

Non-streaming fallback. Same request body, returns JSON directly.

**Response:**
```json
{
  "ok": true,
  "task": "destinations",
  "mode": "claude",
  "data": "[{...}]"
}
```

### `GET /api/config`

Returns UI configuration settings.

**Response:**
```json
{
  "show_agent_timer": true,
  "jiuwenclaw_mode": "agent.plan"
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "claude_key_set": true,
  "jiuwenclaw_ws": "ws://localhost:19000/ws",
  "openjiuwen_url": "http://localhost:8080/agents/execute"
}
```

### `GET /`

Serves the frontend SPA (`index.html`).

---

## External APIs Used

| Service | What For | Cost |
|---------|----------|------|
| Anthropic Claude Haiku 4 | AI trip planning (Claude mode) | Paid |
| Open-Meteo | 14-day weather forecast | Free |
| Nominatim / OpenStreetMap | Geocoding hotel addresses for map | Free |
| @fawazahmed0 currency API (jsDelivr) | Live exchange rates | Free |
| Wikipedia REST API | Destination hero image + attraction photos | Free |
| Leaflet.js + CARTO tiles | Interactive map | Free |
| Google Fonts | Playfair Display, DM Sans | Free |

---

## Extending TripWise

### Adding a New Backend

1. Create `services/yourbackend_service.py` with `async def stream_yourbackend(system_prompt, user_message, task) -> AsyncGenerator[dict, None]`
2. Import in `routers/travel.py`
3. Add `elif mode == "yourbackend":` branch in the router
4. Update frontend to include new backend option in settings modal
5. Document configuration in `.env.example`

### Adding a New Planning Step

1. Add prompt template in `utils/prompts.py`
2. Create phase renderer in `static/js/phase_renderer_yourstep.js`
3. Add task launcher in `static/js/task_launchers.js`
4. Update phase sequence in `static/js/state.js`
5. Wire up in `static/js/main_renderer.js`

### Customizing Prompts

All prompts are in `utils/prompts.py`. Modify `build_system_prompt()` to adjust task instructions, output schemas, or result counts.

---

## Running Locally

```bash
cd Tripwise
cp .env.example .env          # configure API keys and backend URLs
uv sync
uv run main.py                # starts on http://localhost:3025
```

Open `http://localhost:3025` in a browser. Select the AI backend in the settings dropdown:

- **JiuwenClaw** ✅ - Requires JiuwenClaw agent running on `ws://localhost:19000/ws`
- **OpenJiuwen** ✅ - Requires OpenJiuwen agent running on `http://localhost:8080`
- **Debug** ✅ - No setup required; returns mock data instantly (perfect for testing)
- **Claude** ⚠️ **(Disabled)** - Integration not finalized
- **OpenClaw** ⚠️ **(Disabled)** - Integration not finalized

For a quick test without any backend setup, select **Debug** mode and start planning immediately.

### One session + team mode

- **One session** — every request reuses a single stable session id
  (`JIUWENCLAW_SESSION_ID`, default `tripwise`), so later steps (flights, hotels,
  itinerary) can reference the context of earlier ones. Parallelism is NOT done via
  parallel pages; it comes from team mode.
- **Team mode** — in the JiuwenClaw settings pick **Cluster** (`mode: "team"`). The
  request is sent with `"mode": "team"`; the server spawns a team inside that session
  (members work in parallel) and the leader's final answer arrives as the normal
  `chat.final` stream, with teammate activity surfacing as `team.*` / status events.

### Backend Requirements

Each AI backend has specific setup requirements:

| Backend | Status | Setup Required | Configuration |
|---------|--------|---------------|---------------|
| **Debug** | ✅ Active | None | No configuration needed - instant mock data |
| **JiuwenClaw** | ✅ Active | Local agent process | 1. Start JiuwenClaw: see JiuwenClaw docs<br>2. Set `JIUWENCLAW_WS_URL=ws://localhost:19000/ws`<br>3. Optional: Set `DEFAULT_JIUWENCLAW_MODE` (this can be changed in the Settings UI) |
| **OpenJiuwen** | ✅ Active | Local agent studio | 1. Start OpenJiuwen on port 8080: see OpenJiuwen docs<br>2. Set `OPENJIUWEN_URL=http://localhost:8080/agents/execute`<br>3. Configure `OPENJIUWEN_AGENT_ID`<br>4. Optional: change `OPENJIUWEN_CONV_ID` to join a past conversation |
| **Claude** | ⚠️ Disabled | Anthropic API key | *Integration not finalized* |
| **OpenClaw** | ⚠️ Disabled | Local gateway process | *Integration not finalized* |

---

## Troubleshooting

### Backend Not Responding

**JiuwenClaw:** Ensure WebSocket server is running on port 19000. Test with: `curl ws://localhost:19000/ws`

**OpenJiuwen:** Verify that the agent studio backend is accessible at `http://localhost:8000`. Check agent ID matches. Verify that you are authenticated via Webhook Server. Make sure the paths to `agent-studio` and to `agent-core` are in your `PYTHONPATH`.

**Claude:** ⚠️ Currently disabled - integration not finalized.

**OpenClaw:** ⚠️ Currently disabled - integration not finalized.

### WebSocket Timeout

If a planning step takes longer than 30 minutes (1800s), increase `WS_TIMEOUT` in `.env`.

### Mock Data Not Loading

Switch to **Debug** mode if AI backends are misconfigured. Debug mode always works offline.

### Frontend Not Loading

Ensure `static/` directory exists with `index.html` and `js/` subdirectory. Check browser console for errors.

---

## Project File Map

```
TripwisePython/
├── main.py                        FastAPI entry point
├── config.py                      Environment-based settings (pydantic-settings)
├── requirements.txt               Python dependencies
├── .env.example                   Environment variable template
├── routers/
│   └── travel.py                  POST /api/travel/stream (SSE endpoint)
├── services/
│   ├── claude_service.py          Anthropic API streaming adapter
│   ├── jiuwenclaw_service.py      JiuwenClaw WebSocket adapter (delta aggregation)
│   ├── openclaw_service.py        OpenClaw gateway protocol v3 adapter
│   ├── openjiuwen_service.py      OpenJiuwen HTTP adapter
│   └── debug_service.py           Mock data service (no external calls)
├── utils/
│   ├── prompts.py                 Per-task LLM prompt builder
│   ├── context_builder.py         Trip-state → readable string
│   └── json_parser.py             Extract JSON from LLM text
├── blog/                          Marketing & technical blog posts
└── static/
    ├── index.html                 App shell
    ├── style.css                  All styles + print media query
    ├── pics/                      Logo and images
    └── js/                        39 modular feature files (see table above)
```

---

## Architecture Philosophy

TripWise demonstrates several key architectural principles:

1. **Backend Agnostic** - The same prompts and context work with any LLM backend. No vendor lock-in.
2. **Thin Orchestration** - TripWise has zero travel domain logic. All intelligence lives in the AI backend.
3. **Progressive Enhancement** - Each planning step builds on previous selections, maintaining complete context.
4. **Graceful Degradation** - Skip steps freely; the workflow adapts. Use Debug mode when backends are unavailable.
5. **Real-time Streaming** - SSE provides live feedback without complex WebSocket management.
6. **Zero Build Complexity** - Pure vanilla JS with no bundler, transpiler, or framework. Just serve static files.

## Credits & License

TripWise is a demonstration project showcasing the OpenJiuwen agentic infrastructure. It illustrates how different AI backends can power the same user experience through a unified interface.

**Technologies:**
- Backend: FastAPI, Uvicorn, Anthropic SDK, WebSockets, Pydantic
- Frontend: Vanilla JavaScript, Leaflet.js, Open-Meteo, Wikipedia API
- AI: OpenJiuwen, JiuwenClaw, OpenClaw, Anthropic Claude

**Purpose:** Educational demo for building agent-powered applications with interchangeable backends.

---

**Built with ❤️ for the AI agent development community**
