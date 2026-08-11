/* ── 3. WhatsApp / Email share ───────────────────────────────────── */
function shareWhatsApp(){
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  const it=S.itinerary;
  let txt=`✈️ Our trip to ${dest?dest.name+', '+dest.country:'paradise'}!\n📅 ${S.budget.dateFrom} – ${S.budget.dateTo}\n`;
  if(it?.summary) txt+=`\n${it.summary}\n`;
  txt+=`\nPlanned with Tripwise 🗺️`;
  window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
}
function shareEmail(){
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  const subj=`Our trip to ${dest?dest.name+', '+dest.country:'paradise'} – ${S.budget.dateFrom}`;
  const it=S.itinerary;
  let body=`Trip to ${dest?dest.name+', '+dest.country:''}\n📅 ${S.budget.dateFrom} – ${S.budget.dateTo}\n\n${it?.summary||''}\n\n`;
  (it?.days||[]).forEach(day=>{
    body+=`── Day ${day.day}: ${day.title} ──\n`;
    (day.items||[]).forEach(item=>{
      body+=`  ${item.time}  ${item.activity}`;
      if(item.location) body+=` · ${item.location}`;
      body+='\n';
    });
    body+='\n';
  });
  window.location.href=`mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
}
