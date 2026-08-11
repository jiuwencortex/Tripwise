/* ── Wikipedia image fetch for attractions ────────────────────────────────── */
async function fetchAttractionImages(){
  if(!S.attractions||S.attractions.length===0) return;
  S.attractionImages={};
  for(const a of S.attractions){
    // Use just the attraction name for Wikipedia (imageSearchQuery is often too specific)
    const title=encodeURIComponent(a.name);
    try{
      const res=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      if(!res.ok) continue;
      const data=await res.json();
      if(data.thumbnail&&data.thumbnail.source){
        S.attractionImages[a.name]=data.thumbnail.source;
        render(); // re-render as images arrive
      }
    }catch(_){}
  }
}

/* ── phase renderer attractions ──────────────────────────────────────────────── */
function renderAttractions(){
  const d=S.destinations[S.selectedDest];

  // Skipped state
  if(S.attractionsSkipped && !S.loading){
    return `<div class="column">
  <div class="card" style="text-align:center;padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-size:56px">🎭</div>
    <h2 class="title" style="margin:0">Skipping specific attractions</h2>
    <p class="desc" style="max-width:420px;margin:0">The itinerary will be generated with general activities. Change your mind? Browse attractions anytime.</p>
    <button class="btn primary" onclick="findAttractions()">Browse Attractions</button>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(6)">← Back</button>
  </div>
</div>`;}

  return `<div class="column">
  <h2 class="title">Top Attractions in ${esc(d?.name||"")}</h2>
  <p class="desc">Select the ones you'd like to include in your itinerary. Or skip to let us choose.</p>
  <div class="grid-2">${S.attractions.map((a,i)=>{
    const sel=S.selectedAttractions.includes(i);
    const img=S.attractionImages&&S.attractionImages[a.name];
    // Use Wikipedia image if available; otherwise show a styled placeholder (no random stock photos)
    const imgContent=img
      ?`<img src="${img}" alt="${esc(a.name)}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;opacity:.4\\'>🏛️</div>'">`
      :`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;opacity:.4">🏛️</div>`;
    const linkBtn=a.url
      ?`<a href="${a.url}" target="_blank" rel="noopener noreferrer"
           style="font-size:12px;color:var(--accent);text-decoration:none;display:inline-flex;align-items:center;gap:3px;margin-top:4px"
           onclick="event.stopPropagation()">🔗 Learn more</a>`
      :'';
    const selBadge=sel?`<div style="position:absolute;top:8px;right:8px;background:var(--accent);color:#fff;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;z-index:2;pointer-events:none">✓ Selected</div>`:'';
    return `<div class="card selectable ${sel?"selected":""}" onclick="
      if(S.selectedAttractions.includes(${i})){S.selectedAttractions=S.selectedAttractions.filter(x=>x!==${i});}
      else{S.selectedAttractions=[...S.selectedAttractions,${i}];}render();">
      <div style="height:140px;border-radius:10px;margin-bottom:10px;overflow:hidden;background:#1e2535;flex-shrink:0;position:relative">
        ${imgContent}
        ${selBadge}
      </div>
      <div style="font-size:15px;font-weight:700;font-family:var(--heading)">${esc(a.name)}</div>
      <div class="accent" style="font-size:12px;margin-bottom:6px">${esc(a.type)} · ${esc(a.duration)}</div>
      <div class="muted" style="font-size:13px;line-height:1.5;margin-bottom:8px">${esc(a.description)}</div>
      <div class="muted" style="font-size:12px;font-style:italic;margin-bottom:4px">💡 ${esc(a.tips)}</div>
      ${linkBtn}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
        <span style="font-size:13px">${"★".repeat(Math.round(a.rating))}${"☆".repeat(5-Math.round(a.rating))}</span>
        <span style="font-size:16px;font-weight:700;font-family:var(--heading);color:var(--accent)">${a.estimatedCost===0?"Free":`${esc(a.estimatedCost)} ${esc(S.budget.currency)}`}</span>
      </div>
    </div>`;}).join("")}
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(6)">← Back</button>
    <button class="btn" onclick="skipAttractions()">Skip →</button>
    <button class="btn primary" onclick="generateItinerary()" ${S.selectedAttractions.length===0?"disabled":""}>Generate Itinerary →</button>
  </div>
</div>`;}
