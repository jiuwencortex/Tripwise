/* ── phase renderer itinerary ──────────────────────────────────────────────── */

/* Returns a colored circle badge matching the Leaflet map marker */
function _mapMarkerBadge(dayIdx, seq){
  const color=_DAY_COLORS[dayIdx%_DAY_COLORS.length];
  const label=seq<=9?String(seq):'…';
  return `<div title="Map marker Day ${dayIdx+1} #${seq}" style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`;
}

function renderItinerary(){
  const isTimeline=S.itineraryView==="timeline";

  /* Map legend — shows which color = which day */
  const anyCoords=(S.itinerary?.days||[]).some(d=>(d.items||[]).some(i=>i.lat&&i.lng));
  const legendHtml=anyCoords?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;align-items:center">
    <span style="font-size:11px;color:var(--fg-dim)">Map:</span>
    ${(S.itinerary?.days||[]).map((d,di)=>`
      <div style="display:flex;align-items:center;gap:4px">
        <div style="width:14px;height:14px;border-radius:50%;background:${_DAY_COLORS[di%_DAY_COLORS.length]}"></div>
        <span style="font-size:11px;color:var(--fg-dim)">Day ${d.day}</span>
      </div>`).join('')}
    <span style="font-size:11px;color:var(--fg-dim)">· numbers match pins</span>
  </div>`:'';

  const listContent=(S.itinerary?.days||[]).map((day,di)=>{
    let seq=0;
    return `<div>
      <div style="font-size:16px;font-weight:700;font-family:var(--heading);color:var(--accent);margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid var(--border)">
        Day ${esc(day.day)}: ${esc(day.title)}
      </div>
      <div>${(day.items||[]).map(item=>{
        const hasCoords=!!(item.lat&&item.lng);
        if(hasCoords) seq++;
        return `<div class="itinerary-item">
          <div style="font-size:14px;font-weight:700;color:var(--accent)">${esc(item.time)}</div>
          <div style="display:flex;align-items:flex-start;gap:7px;min-width:0">
            ${hasCoords?_mapMarkerBadge(di,seq):'<div style="width:22px;flex-shrink:0"></div>'}
            <div style="min-width:0">
              <div style="font-size:14px;font-weight:600">${esc(item.activity)}</div>
              <div class="muted" style="font-size:12px">📍 ${esc(item.location)}</div>
              ${item.notes?`<div class="muted" style="font-size:11px;font-style:italic;margin-top:2px">${esc(item.notes)}</div>`:""}
            </div>
          </div>
          ${item.cost>0?`<div style="font-size:13px;font-weight:600;color:var(--accent)">${esc(item.cost)} ${esc(S.budget.currency)}</div>`:"<div></div>"}
        </div>`;}).join("")}
      </div>
    </div>`;}).join("");

  return `<div class="column">
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:4px">
    <h2 class="title" style="margin:0">${esc(S.itinerary?.title||"Your Itinerary")}</h2>
    <div style="display:flex;gap:6px">
      <button class="trip-btn${!isTimeline?' active':''}" onclick="S.itineraryView='list';render()">☰ List</button>
      <button class="trip-btn${isTimeline?' active':''}" onclick="S.itineraryView='timeline';render()">📅 Timeline</button>
    </div>
  </div>
  <p class="desc">${esc(S.itinerary?.summary||"")}</p>
  ${!isTimeline?legendHtml:''}
  ${isTimeline ? renderItineraryTimeline() : listContent}
  <div class="btn-row">
    <button class="btn" onclick="setPhase(7)">← Back</button>
    <button class="btn primary" onclick="setPhase(9)">View Trip Summary & Map →</button>
  </div>
</div>`;}
