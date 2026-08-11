/* ── context bar ──────────────────────────────────────────────────── */
function renderContextBar(){
  const el=document.getElementById("contextBar");
  if(!el) return;
  if(S.phase<1){el.style.display="none";return;}
  const d=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  const fl=S.selectedFlight!=null?S.flights[S.selectedFlight]:null;
  const ht=S.selectedHotel!=null?S.hotels[S.selectedHotel]:null;
  const cr=S.selectedCar!=null&&S.selectedCar>=0?S.carRentals[S.selectedCar]:null;
  const tv=Number(S.profile.adults||0)+Number(S.profile.children||0);
  const items=[];
  if(d) items.push(`✈️ ${esc(S.profile.origin)} → <strong>${esc(d.name)}, ${esc(d.country)}</strong>`);
  else   items.push(`📍 From: <strong>${esc(S.profile.origin)}</strong>`);
  if(S.budget.dateFrom&&S.budget.dateTo){
    const nd=days(S.budget.dateFrom,S.budget.dateTo);
    items.push(`📅 <strong>${esc(S.budget.dateFrom)}</strong> – <strong>${esc(S.budget.dateTo)}</strong> (${nd}d)`);
  }
  items.push(`👥 <strong>${tv}</strong> traveler${tv!==1?"s":""}`);
  items.push(`💰 <strong>${esc(S.budget.total)}</strong> ${esc(S.budget.currency)}`);
  if(fl) items.push(`🛫 <strong>${esc(fl.airline)}</strong> ${esc(fl.route)}`);
  if(ht) items.push(`🏨 <strong>${esc(ht.name)}</strong>`);
  if(cr) items.push(`🚗 <strong>${esc(cr.company)}</strong> ${esc(cr.model)}`);
  if(S.selectedAttractions.length>0) items.push(`🎭 <strong>${S.selectedAttractions.length}</strong> attraction${S.selectedAttractions.length!==1?"s":""}`);
  // Live budget meter
  const nd2=S.budget.dateFrom&&S.budget.dateTo?days(S.budget.dateFrom,S.budget.dateTo):0;
  const nn2=Math.max(0,nd2-1);
  const tf2=fl?fl.price*tv:0;
  const th2=ht?ht.pricePerNight*nn2:0;
  const tc2=cr?cr.pricePerDay*nd2:0;
  const ta2=S.selectedAttractions.reduce((s,i)=>s+(S.attractions[i]?.estimatedCost||0),0)*tv;
  const spent=tf2+th2+tc2+ta2;
  const bgt2=Number(S.budget.total||0);
  const budgetBar=spent>0&&bgt2>0?`<div class="ctx-budget-row">
    <span class="ctx-budget-label">💰 ${spent} / ${bgt2} ${_budgetCCY()}</span>
    <div class="ctx-budget-track"><div class="ctx-budget-fill" style="width:${Math.min(100,Math.round(spent/bgt2*100))}%;background:${spent>bgt2?"#ff8b7a":spent/bgt2>0.85?"#E9C46A":"#2A9D8F"}"></div></div>
    <span class="ctx-budget-label">${spent>bgt2?`⚠️ +${spent-bgt2} over`:`${bgt2-spent} left`}</span>
  </div>`:'';

  el.style.display="flex";
  el.innerHTML=items.map(i=>`<span class="ctx-item">${i}</span>`).join('<span class="ctx-sep">·</span>')+budgetBar;
}
