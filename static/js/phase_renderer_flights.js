/* ── phase renderers flights ──────────────────────────────────────────────── */
function renderFlights(){
  const d=S.destinations[S.selectedDest];
  if(S.flightsSkipped && !S.loading){
    return `<div class="column">
  <div class="card" style="text-align:center;padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-size:56px">✈️</div>
    <h2 class="title" style="margin:0">Traveling to ${esc(d?.name||'')} your own way</h2>
    <p class="desc" style="max-width:420px;margin:0">You decided to arrange flights independently. Change your mind? Search here anytime.</p>
    <button class="btn primary" onclick="findFlights()">Find Flights Anyway</button>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(3)">← Back</button>
    <button class="btn" onclick="skipHotels()">No Hotel →</button>
    <button class="btn primary" onclick="findHotels()">Find Hotels →</button>
  </div>
</div>`;}
  // Fire airline image fetch in background if needed
  if(S.flights.some(f=>f.airline&&!(f.airline in S.flightImages))) setTimeout(()=>{if(typeof fetchFlightImages==='function')fetchFlightImages();},0);
  return `<div class="column">
  <h2 class="title">Flight Options to ${esc(d?.name||"")}</h2>
  <p class="desc">Select the best flight for your journey.</p>
  <div class="column" style="gap:12px">${S.flights.map((f,i)=>`
    <div class="card selectable ${S.selectedFlight===i?"selected":""}" onclick="S.selectedFlight=${i};render()">
      <div class="grid-4">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${S.flightImages[f.airline]
              ?`<img src="${S.flightImages[f.airline]}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">`
              :`<div style="width:28px;height:28px;border-radius:4px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">✈️</div>`}
            <div style="font-size:16px;font-weight:700;font-family:var(--heading)">${esc(f.airline)}</div>
          </div>
          <div class="muted" style="font-size:13px">✈️ ${esc(f.route)}</div>
          ${f.returnRoute?`<div class="muted" style="font-size:12px">🔄 ${esc(f.returnRoute)}</div>`:''}
          <div class="muted" style="font-size:12px;margin-top:4px">${esc(f.pros)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:var(--fg-dim);margin-bottom:2px">Outbound</div>
          <div style="font-size:13px;font-weight:600">${esc(f.departTime)} → ${esc(f.arriveTime)}</div>
          <div class="muted" style="font-size:11px">${esc(f.duration)} · ${f.stops===0?"Direct":`${esc(f.stops)} stop${f.stops>1?"s":""}`}</div>
          ${f.returnDepartTime?`<div style="font-size:11px;color:var(--fg-dim);margin-top:6px">Return</div>
          <div style="font-size:13px;font-weight:600">${esc(f.returnDepartTime)} → ${esc(f.returnArriveTime||'')}</div>`:''}
        </div>
        <div style="text-align:center;font-size:12px" class="muted">${esc(f.class)}</div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:800;font-family:var(--heading);color:var(--accent)">${esc(f.price)} <span style="font-size:12px;font-weight:400">${esc(S.budget.currency)}</span></div>
          <div class="muted" style="font-size:11px">round-trip / person</div>
        </div>
      </div>
    </div>`).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(3)">← Back</button>
    <button class="btn" onclick="skipHotels()" title="Skip hotel search — arrange accommodation yourself">No Hotel →</button>
    <button class="btn primary" onclick="findHotels()" ${S.selectedFlight==null?"disabled":""}>Find Hotels →</button>
  </div>
</div>`;}
