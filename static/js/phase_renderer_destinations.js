/* ── phase renderer destinations ──────────────────────────────────────────────── */
function renderDestinations(){return `<div class="column">
  <h2 class="title">Your Top Destinations</h2>
  <p class="desc">Matches based on your profile, budget, and preferences.</p>
  <div class="grid-2">${S.destinations.map((d,i)=>`
    <div class="card selectable ${S.selectedDest===i?"selected":""}" onclick="S.selectedDest=${i};render()">
      ${S.selectedDest===i?`<div class="badge">SELECTED</div>`:""}
      <div style="font-size:18px;font-weight:700;font-family:var(--heading)">${esc(d.name)}</div>
      <div class="accent" style="font-size:13px;margin-bottom:8px">${esc(d.country)}</div>
      <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:12px">${esc(d.description)}</div>
      <div class="score-row">${scoreCircle(d.matchScore,"Match")}${scoreCircle(d.budgetScore,"Budget")}${scoreCircle(d.weatherScore,"Weather")}</div>
      <div>${(d.highlights||[]).map(h=>`<span class="chip">${esc(h)}</span>`).join("")}</div>
      <div class="muted" style="margin-top:10px;font-size:12px">✈️ ~${esc(d.estFlightCost)} ${esc(S.budget.currency)} | 🏨 ~${esc(d.estHotelPerNight)} ${esc(S.budget.currency)}/night</div>
    </div>`).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(2)">← Back</button>
    <button class="btn" onclick="skipFlights()" ${S.selectedDest==null?"disabled":""} title="Skip flight search — arrange travel yourself">No Flights →</button>
    <button class="btn primary" onclick="findFlights()" ${S.selectedDest==null?"disabled":""}>Find Flights →</button>
  </div>
</div>`;}

function renderFlights(){
  const d=S.destinations[S.selectedDest];
  return `<div class="column">
  <h2 class="title">Flight Options to ${esc(d?.name||"")}</h2>
  <p class="desc">Select the best flight for your journey.</p>
  <div class="column" style="gap:12px">${S.flights.map((f,i)=>`
    <div class="card selectable ${S.selectedFlight===i?"selected":""}" onclick="S.selectedFlight=${i};render()">
      <div class="grid-4">
        <div>
          <div style="font-size:16px;font-weight:700;font-family:var(--heading)">${esc(f.airline)}</div>
          <div class="muted" style="font-size:13px">${esc(f.route)}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">${esc(f.pros)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:14px;font-weight:600">${esc(f.departTime)}</div>
          <div class="muted" style="font-size:11px">${esc(f.duration)}</div>
          <div class="muted" style="font-size:11px">${f.stops===0?"Direct":`${esc(f.stops)} stop${f.stops>1?"s":""}`}</div>
        </div>
        <div style="text-align:center;font-size:12px" class="muted">${esc(f.class)}</div>
        <div style="text-align:right;font-size:20px;font-weight:800;font-family:var(--heading);color:var(--accent)">${esc(f.price)} <span style="font-size:12px;font-weight:400">${esc(S.budget.currency)}</span></div>
      </div>
    </div>`).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(3)">← Back</button>
    <button class="btn primary" onclick="findHotels()" ${S.selectedFlight==null?"disabled":""}>Find Hotels →</button>
  </div>
</div>`;}
