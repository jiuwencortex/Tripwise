/* ── Copy itinerary ───────────────────────────────────────────────── */
function copyItinerary(){
  const it=S.itinerary; if(!it) return;
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  let t=`✈️ ${it.title||'My Itinerary'}\n`;
  if(dest) t+=`📍 ${dest.name}, ${dest.country}\n`;
  t+=`📅 ${S.budget.dateFrom} – ${S.budget.dateTo}\n\n${it.summary||''}\n\n`;
  (it.days||[]).forEach(day=>{
    t+=`── Day ${day.day}: ${day.title} ──\n`;
    (day.items||[]).forEach(item=>{
      t+=`  ${item.time}  ${item.activity}`;
      if(item.location) t+=` · ${item.location}`;
      if(item.cost>0) t+=` · ${item.cost} ${S.budget.currency}`;
      t+='\n';
      if(item.notes) t+=`     💡 ${item.notes}\n`;
    });
    t+='\n';
  });
  navigator.clipboard.writeText(t).then(()=>{
    const btn=document.getElementById('copyItinBtn');
    if(btn){btn.textContent='✅ Copied!';btn.classList.add('success');setTimeout(()=>{btn.textContent='📋 Copy Itinerary';btn.classList.remove('success');},2200);}
  }).catch(()=>alert('Clipboard access denied.'));
}
