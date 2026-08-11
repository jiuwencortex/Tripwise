/* ── Wikipedia image fetch for hotels ───────────────────────────────────── */
async function _wikiThumb(title){
  try{
    const res=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if(!res.ok) return null;
    const data=await res.json();
    return (data.thumbnail&&data.thumbnail.source)?data.thumbnail.source:null;
  }catch(_){ return null; }
}
async function fetchHotelImages(){
  if(!S.hotels||S.hotels.length===0) return;
  S.hotelImages={};
  const dest=S.destinations[S.selectedDest];
  for(const h of S.hotels){
    // Strip star ratings (e.g. "4*", "5 Stars") and category suffixes
    const hotelClean=h.name
      .replace(/\s*\d+\s*[\*★]\s*(superior|deluxe|executive|premium|luxury|standard|budget|classic|comfort|plus)?/gi,'')
      .replace(/\s+(superior|deluxe|executive|premium|luxury|standard|budget|classic|comfort|plus)\s*$/gi,'')
      .trim();
    // Fallback chain: hotel → neighborhood → destination city
    const neighborhood=h.neighborhood?h.neighborhood.split(',')[0].trim():'';
    const queries=[hotelClean, neighborhood, dest?dest.name:''].filter(Boolean);
    for(const q of queries){
      const src=await _wikiThumb(q);
      if(src){
        S.hotelImages[h.name]=src;
        render();
        break;
      }
    }
  }
}

async function fetchFlightImages(){
  if(!S.flights||S.flights.length===0) return;
  let changed=false;
  for(const f of S.flights){
    if(!f.airline||(f.airline in S.flightImages)) continue;
    // Try "Airline Name airline" then just the airline name
    const src=await _wikiThumb(f.airline+' airline')||await _wikiThumb(f.airline);
    if(src){S.flightImages[f.airline]=src;changed=true;}
    else S.flightImages[f.airline]=''; // mark as tried/empty
  }
  if(changed) render();
}

/* ── phase renderer hotels ──────────────────────────────────────────────── */
function renderHotels(){
  const d=S.destinations[S.selectedDest];
  if(S.hotelsSkipped && !S.loading){
    return `<div class="column">
  <div class="card" style="text-align:center;padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-size:56px">🏨</div>
    <h2 class="title" style="margin:0">Staying in ${esc(d?.name||'')} on your own terms</h2>
    <p class="desc" style="max-width:420px;margin:0">You decided to arrange accommodation independently. Change your mind? Search here anytime.</p>
    <button class="btn primary" onclick="findHotels()">Find Hotels Anyway</button>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(4)">← Back</button>
    <button class="btn" onclick="skipCarRental()">No Car →</button>
    <button class="btn primary" onclick="findCarRentals()">Find Car Rentals →</button>
  </div>
</div>`;}
  return `<div class="column">
  <h2 class="title">Where to Stay in ${esc(d?.name||"")}</h2>
  <p class="desc">Accommodations matched to your style and budget.</p>
  <div class="grid-2">${S.hotels.map((h,i)=>{
    const img=S.hotelImages&&S.hotelImages[h.name];
    const selBadge=S.selectedHotel===i?`<div style="position:absolute;top:8px;right:8px;background:var(--accent);color:#fff;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;z-index:2;pointer-events:none">✓ Selected</div>`:'';
    const imgHtmlWithBadge=`<div style="height:150px;border-radius:10px;margin-bottom:10px;overflow:hidden;background:#1e2535;flex-shrink:0;position:relative">
      ${img
        ?`<img src="${img}" alt="${esc(h.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.35\\'>🏨</div>'">`
        :`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.35">🏨</div>`}
      ${selBadge}
    </div>`;
    return `<div class="card selectable ${S.selectedHotel===i?"selected":""}" onclick="S.selectedHotel=${i};render()">
      ${imgHtmlWithBadge}
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
        <div>
          <div style="font-size:16px;font-weight:700;font-family:var(--heading)">${esc(h.name)}</div>
          <div class="accent" style="font-size:12px">${esc(h.type)} · ${esc(h.neighborhood)}</div>
        </div>
        ${scoreCircle(h.matchScore,"Match")}
      </div>
      <div class="muted" style="font-size:13px;line-height:1.5;margin:10px 0">${esc(h.description)}</div>
      <div>${(h.amenities||[]).map(a=>`<span class="chip">${esc(a)}</span>`).join("")}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span style="font-size:13px">${"★".repeat(Math.round(h.rating))}${"☆".repeat(5-Math.round(h.rating))}</span>
        <span style="font-size:20px;font-weight:800;font-family:var(--heading);color:var(--accent)">${esc(h.pricePerNight)} <span style="font-size:12px;font-weight:400">${esc(S.budget.currency)}/night</span></span>
      </div>
    </div>`;}).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(4)">← Back</button>
    <button class="btn" onclick="skipCarRental()" ${S.selectedHotel==null?"disabled":""} title="Skip car rental — use public transport or taxis">No Car →</button>
    <button class="btn primary" onclick="findCarRentals()" ${S.selectedHotel==null?"disabled":""}>Find Car Rentals →</button>
  </div>
</div>`;}
