/* ── Wikipedia image fetch for car models ───────────────────────────────── */
async function fetchCarImages(){
  if(!S.carRentals||S.carRentals.length===0) return;
  S.carImages={};
  for(const c of S.carRentals){
    const key=`${c.company} ${c.model}`;
    // Strip LLM suffixes like "or similar", "or equivalent" before Wikipedia lookup
    const modelClean=c.model.replace(/\s+(or|and)\s+(similar|equivalent|comparable).*/i,'').trim();
    const query=encodeURIComponent(modelClean);
    try{
      const res=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
      if(!res.ok) continue;
      const data=await res.json();
      if(data.thumbnail&&data.thumbnail.source){
        S.carImages[key]=data.thumbnail.source;
        render();
      }
    }catch(_){}
  }
}

/* ── phase renderer cars ──────────────────────────────────────────────── */
function renderCars(){
  if(S.carSkipped && !S.loading){
    return `<div class="column">
  <div class="card" style="text-align:center;padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-size:56px">🚗</div>
    <h2 class="title" style="margin:0">Getting around without a rental car</h2>
    <p class="desc" style="max-width:420px;margin:0">You decided to use public transport, taxis, or other means. Change your mind? Search here anytime.</p>
    <button class="btn primary" onclick="findCarRentals()">Find Car Rentals Anyway</button>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(5)">← Back</button>
    <button class="btn primary" onclick="findAttractions()">Discover Attractions →</button>
  </div>
</div>`;}
  return `<div class="column">
  <h2 class="title">Car Rental Options</h2>
  <p class="desc">Get around on your own terms.</p>
  <div class="grid-2">${S.carRentals.map((c,i)=>{
    const key=`${c.company} ${c.model}`;
    const img=S.carImages&&S.carImages[key];
    const selBadge=S.selectedCar===i?`<div style="position:absolute;top:8px;right:8px;background:var(--accent);color:#fff;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;z-index:2;pointer-events:none">✓ Selected</div>`:'';
    const imgHtml=`<div style="height:140px;border-radius:10px;margin-bottom:10px;overflow:hidden;background:#1e2535;flex-shrink:0;position:relative">
      ${img
        ?`<img src="${img}" alt="${esc(c.model)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.35\\'>🚗</div>'">`
        :`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.35">🚗</div>`}
      ${selBadge}
    </div>`;
    return `<div class="card selectable ${S.selectedCar===i?"selected":""}" onclick="S.selectedCar=${i};render()">
      ${imgHtml}
      <div style="font-size:16px;font-weight:700;font-family:var(--heading)">${esc(c.company)}</div>
      <div class="accent" style="font-size:14px">${esc(c.model)}</div>
      <div class="muted" style="font-size:12px;margin-top:4px">${esc(c.carType)} · ${esc(c.transmission)}</div>
      <div style="margin:10px 0">${(c.features||[]).map(f=>`<span class="chip">${esc(f)}</span>`).join("")}</div>
      <div class="muted" style="font-size:12px">📍 ${esc(c.pickupLocation)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span style="font-size:13px">${"★".repeat(Math.round(c.rating))}${"☆".repeat(5-Math.round(c.rating))}</span>
        <span style="font-size:20px;font-weight:800;font-family:var(--heading);color:var(--accent)">${esc(c.pricePerDay)} <span style="font-size:12px;font-weight:400">${esc(S.budget.currency)}/day</span></span>
      </div>
    </div>`;}).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(5)">← Back</button>
    <button class="btn primary" onclick="findAttractions()" ${S.selectedCar==null?"disabled":""}>Discover Attractions →</button>
  </div>
</div>`;}
