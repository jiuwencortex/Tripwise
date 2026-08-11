/* ── phase renderer summary ──────────────────────────────────────────────── */
function _expandCard(key,summaryHtml,detailHtml){
  const open=_expanded.has(key);
  return `
    ${summaryHtml}
    <div class="expand-body" style="max-height:${open?"600px":"0"};opacity:${open?"1":"0"};padding-top:${open?"10px":"0"}">
      ${open?detailHtml:""}
    </div>
    <div class="expand-toggle" onclick="toggleExpand('${key}')">${open?"▲ Hide details":"▼ Show details"}</div>`;
}
function renderSummary(){
  // Auto-expand all main cards the first time summary is shown
  ['flight','hotel','car','activities'].forEach(k=>_expanded.add(k));

  const dest=S.destinations[S.selectedDest];
  const fl=S.selectedFlight!=null?S.flights[S.selectedFlight]:null;
  const ht=S.selectedHotel!=null?S.hotels[S.selectedHotel]:null;
  const cr=S.selectedCar!=null&&S.selectedCar>=0?S.carRentals[S.selectedCar]:null;
  // Detect skipped items (fetched nothing + nothing selected)
  const flightSkipped=!fl&&S.flights.length===0;
  const hotelSkipped=!ht&&S.hotels.length===0;
  const carSkipped=!cr;
  const nd=days(S.budget.dateFrom,S.budget.dateTo);
  const nn=Math.max(0,nd-1);
  const tv=Number(S.profile.adults||0)+Number(S.profile.children||0);
  const tf=fl?fl.price*tv:0;
  const th=ht?ht.pricePerNight*nn:0;
  const tc=cr?cr.pricePerDay*nd:0;
  const ta=S.selectedAttractions.reduce((s,i)=>s+(S.attractions[i]?.estimatedCost||0),0)*tv;
  const gt=tf+th+tc+ta;
  const bgt=Number(S.budget.total||0);
  const rem=bgt-gt;
  const segs=[
    {label:"Flights",val:tf,color:"#E76F51"},
    {label:"Hotel",  val:th,color:"#2A9D8F"},
    {label:"Car",    val:tc,color:"#E9C46A"},
    {label:"Activities",val:ta,color:"#264653"},
  ].filter(s=>s.val>0);
  const selAttrObjs=S.selectedAttractions.map(i=>S.attractions[i]).filter(Boolean);

  // Kick off airline image fetch in background if needed
  if(fl&&S.flights.some(f=>f.airline&&!(f.airline in S.flightImages))) setTimeout(()=>{if(typeof fetchFlightImages==='function')fetchFlightImages();},0);

  const _skipLabel=(icon,label)=>`
    <div class="muted" style="font-size:12px;margin-bottom:4px">${icon}</div>
    <div style="font-size:14px;color:var(--fg-dim);font-style:italic">Not included — arranging independently</div>`;

  const flightCard=flightSkipped?_skipLabel("✈️ Flight",""):_expandCard("flight",`
    <div class="muted" style="font-size:12px;margin-bottom:6px">✈️ Flight</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      ${fl&&S.flightImages[fl.airline]
        ?`<img src="${S.flightImages[fl.airline]}" style="width:32px;height:32px;object-fit:contain;border-radius:4px;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">`
        :`<div style="width:32px;height:32px;border-radius:4px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">✈️</div>`}
      <div style="font-size:15px;font-weight:700;font-family:var(--heading)">${esc(fl?.airline||"N/A")}</div>
    </div>
    <div class="muted" style="font-size:13px">${esc(fl?.route||"")}</div>
    <div style="font-size:18px;font-weight:800;color:var(--accent);font-family:var(--heading);margin-top:6px">${esc(tf)} ${esc(S.budget.currency)}</div>
    <div class="muted" style="font-size:11px">(${esc(fl?.price||0)} × ${tv} travelers)</div>`,
    fl?`<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--fg-dim);margin-bottom:6px">✈️ Outbound</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      <div><span class="muted">Departs</span><br><strong>${esc(fl.departTime)}</strong></div>
      <div><span class="muted">Arrives</span><br><strong>${esc(fl.arriveTime)}</strong></div>
      <div><span class="muted">Duration</span><br>${esc(fl.duration)}</div>
      <div><span class="muted">Stops</span><br>${fl.stops===0?"✅ Direct":`${esc(fl.stops)} stop(s)`}</div>
      <div><span class="muted">Class</span><br>${esc(fl.class)}</div>
      <div><span class="muted">Per person</span><br>${esc(fl.price)} ${esc(S.budget.currency)}</div>
    </div>
    ${fl.returnDepartTime?`
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--fg-dim);margin:12px 0 6px">🔄 Return</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      <div><span class="muted">Route</span><br>${esc(fl.returnRoute||fl.route||'')}</div>
      <div><span class="muted">Duration</span><br>${esc(fl.returnDuration||fl.duration||'')}</div>
      <div><span class="muted">Departs</span><br><strong>${esc(fl.returnDepartTime)}</strong></div>
      <div><span class="muted">Arrives</span><br><strong>${esc(fl.returnArriveTime||'')}</strong></div>
    </div>`:''}
    ${fl.pros?`<div class="muted" style="font-size:12px;margin-top:8px;font-style:italic">💡 ${esc(fl.pros)}</div>`:""}`:
    "No flight selected"
  );

  const hotelCard=hotelSkipped?_skipLabel("🏨 Accommodation",""):_expandCard("hotel",`
    <div class="muted" style="font-size:12px;margin-bottom:6px">🏨 Accommodation</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      ${ht&&S.hotelImages&&S.hotelImages[ht.name]
        ?`<img src="${S.hotelImages[ht.name]}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">`
        :`<div style="width:40px;height:40px;border-radius:6px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏨</div>`}
      <div style="min-width:0">
        <div style="font-size:15px;font-weight:700;font-family:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ht?.name||"N/A")}</div>
        <div class="muted" style="font-size:12px">${esc(ht?.neighborhood||"")}</div>
      </div>
    </div>
    <div style="font-size:18px;font-weight:800;color:var(--accent);font-family:var(--heading);margin-top:6px">${esc(th)} ${esc(S.budget.currency)}</div>
    <div class="muted" style="font-size:11px">(${esc(ht?.pricePerNight||0)}/night × ${nn} nights)</div>`,
    ht?`<div style="font-size:13px;display:flex;flex-direction:column;gap:6px">
      <div><span class="muted">Type</span> ${esc(ht.type)}</div>
      <div><span class="muted">Rating</span> ${"★".repeat(Math.round(ht.rating))}${"☆".repeat(5-Math.round(ht.rating))}</div>
      <div class="muted" style="line-height:1.5">${esc(ht.description)}</div>
      <div>${(ht.amenities||[]).map(a=>`<span class="chip">${esc(a)}</span>`).join("")}</div>
    </div>`:
    "No hotel selected"
  );

  const _crKey=cr?`${cr.company} ${cr.model}`:'';
  const carCard=cr?_expandCard("car",`
    <div class="muted" style="font-size:12px;margin-bottom:6px">🚗 Car Rental</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      ${cr&&S.carImages&&S.carImages[_crKey]
        ?`<img src="${S.carImages[_crKey]}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">`
        :`<div style="width:40px;height:40px;border-radius:6px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚗</div>`}
      <div style="min-width:0">
        <div style="font-size:15px;font-weight:700;font-family:var(--heading)">${esc(cr.company)} – ${esc(cr.model)}</div>
        <div class="muted" style="font-size:12px">${esc(cr.carType)}</div>
      </div>
    </div>
    <div style="font-size:18px;font-weight:800;color:var(--accent);font-family:var(--heading);margin-top:6px">${esc(tc)} ${esc(S.budget.currency)}</div>
    <div class="muted" style="font-size:11px">(${esc(cr.pricePerDay)}/day × ${nd} days)</div>`,
    `<div style="font-size:13px;display:flex;flex-direction:column;gap:6px">
      <div><span class="muted">Transmission</span> ${esc(cr.transmission)}</div>
      <div><span class="muted">Rating</span> ${"★".repeat(Math.round(cr.rating))}${"☆".repeat(5-Math.round(cr.rating))}</div>
      <div><span class="muted">Pickup</span> 📍 ${esc(cr.pickupLocation)}</div>
      <div>${(cr.features||[]).map(f=>`<span class="chip">${esc(f)}</span>`).join("")}</div>
    </div>`
  ):"";

  const actCard=_expandCard("activities",`
    <div class="muted" style="font-size:12px;margin-bottom:6px">🎭 Activities</div>
    <div style="font-size:15px;font-weight:700;font-family:var(--heading);margin-bottom:6px">${selAttrObjs.length} attraction${selAttrObjs.length!==1?"s":""}</div>
    ${selAttrObjs.length?`<div style="display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden;margin-bottom:6px">
      ${selAttrObjs.slice(0,4).map(a=>{
        const aImg=S.attractionImages&&S.attractionImages[a.name];
        return aImg
          ?`<img src="${aImg}" title="${esc(a.name)}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0" onerror="this.style.display='none'">`
          :`<div title="${esc(a.name)}" style="width:36px;height:36px;border-radius:4px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🏛️</div>`;
      }).join('')}
      ${selAttrObjs.length>4?`<div style="width:36px;height:36px;border-radius:4px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--fg-dim);font-weight:700;flex-shrink:0">+${selAttrObjs.length-4}</div>`:''}
    </div>`:''}
    <div style="font-size:18px;font-weight:800;color:var(--accent);font-family:var(--heading);margin-top:2px">${esc(ta)} ${esc(S.budget.currency)}</div>`,
    selAttrObjs.length?selAttrObjs.map(a=>{
      const aImg=S.attractionImages&&S.attractionImages[a.name];
      const thumb=aImg?`<img src="${aImg}" alt="${esc(a.name)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">`
        :`<div style="width:48px;height:48px;border-radius:6px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏛️</div>`;
      const linkHtml=a.url?`<a href="${a.url}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:var(--accent)" onclick="event.stopPropagation()">🔗 Learn more</a>`:'';
      return `<div style="display:flex;align-items:start;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;gap:10px">
        ${thumb}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${esc(a.name)}</div>
          <div class="muted">${esc(a.type)} · ${esc(a.duration)}</div>
          <div class="muted" style="font-size:12px;font-style:italic">💡 ${esc(a.tips)}</div>
          ${linkHtml}
        </div>
        <div style="white-space:nowrap;color:var(--accent);font-weight:700">${a.estimatedCost===0?"Free":`${esc(a.estimatedCost)} ${esc(S.budget.currency)}`}</div>
      </div>`;}).join(""):
    "No attractions selected"
  );

  return `<div class="column" style="gap:24px">
  ${renderDestHeroBanner()}
  ${renderCountdownCard()}
  <div class="card" style="padding:0;overflow:hidden">
    <div id="tripMap"></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch">
    ${renderDualClock()}
    ${renderWeatherCard()}
    ${renderCurrencyCard()}
  </div>
  ${renderLocalPhrasesCard()}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    <div class="card">${flightCard}</div>
    <div class="card">${hotelCard}</div>
    ${cr?`<div class="card">${carCard}</div>`:""}
    <div class="card">${actCard}</div>
  </div>
  ${S.itinerary?(()=>{
    const isTL=S.itineraryView==='timeline';
    const legendHtml=`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
      ${(S.itinerary.days||[]).map((d,di)=>`
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:12px;height:12px;border-radius:50%;background:${_DAY_COLORS[di%_DAY_COLORS.length]}"></div>
          <span style="font-size:11px;color:var(--fg-dim)">Day ${d.day}</span>
        </div>`).join('')}
      <span style="font-size:11px;color:var(--fg-dim)">· numbers = map pins</span>
    </div>`;
    const listHtml=(S.itinerary.days||[]).map((day,di)=>{
      let seq=0;
      return `<div style="margin-bottom:20px">
        <div style="font-size:15px;font-weight:700;font-family:var(--heading);color:var(--accent);margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--border)">
          Day ${esc(day.day)}: ${esc(day.title)}
        </div>
        ${(day.items||[]).map(item=>{
          const hasCoords=!!(item.lat&&item.lng);
          if(hasCoords) seq++;
          const badge=hasCoords?_mapMarkerBadge(di,seq):'<div style="width:20px;flex-shrink:0"></div>';
          return `<div class="itinerary-item">
            <div style="font-size:13px;font-weight:700;color:var(--accent)">${esc(item.time)}</div>
            <div style="display:flex;align-items:flex-start;gap:6px;min-width:0">
              ${badge}
              <div style="min-width:0">
                <div style="font-size:13px;font-weight:600">${esc(item.activity)}</div>
                <div class="muted" style="font-size:11px">📍 ${esc(item.location)}</div>
                ${item.notes?`<div class="muted" style="font-size:11px;font-style:italic">${esc(item.notes)}</div>`:''}
              </div>
            </div>
            ${item.cost>0?`<div style="font-size:12px;font-weight:600;color:var(--accent)">${esc(item.cost)} ${esc(S.budget.currency)}</div>`:'<div></div>'}
          </div>`;}).join('')}
      </div>`;}).join('');
    return `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <div style="font-size:14px;font-weight:700;font-family:var(--heading)">📋 Daily Itinerary</div>
      <div style="display:flex;gap:6px">
        <button class="trip-btn${!isTL?' active':''}" onclick="S.itineraryView='list';render()">☰ List</button>
        <button class="trip-btn${isTL?' active':''}" onclick="S.itineraryView='timeline';render()">📅 Timeline</button>
      </div>
    </div>
    ${!isTL?legendHtml:''}
    ${isTL?renderItineraryTimeline():listHtml}
  </div>`;})():''}
  ${renderDonutChart(segs, gt, bgt, S.budget.currency)}
  ${renderTripActions()}
  <div style="margin-top:12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(42,157,143,.2);color:var(--fg-dim);font-size:11px;line-height:1.6;text-align:center">
    🤖 This trip was planned by <strong style="color:var(--fg)">OpenJiuwen</strong> AI agents (JiuwenClaw) — the open-source multi-agent engine powering Tripwise ·
    <a href="https://openjiuwen.com/en/" target="_blank" style="color:var(--accent2)">Website</a> ·
    <a href="https://github.com/openJiuwen-ai" target="_blank" style="color:var(--accent2)">GitHub</a> ·
    <a href="https://gitcode.com/openJiuwen" target="_blank" style="color:var(--accent2)">GitCode</a>
  </div>
</div>`;}