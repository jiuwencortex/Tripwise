/* ── Save / Load trips ────────────────────────────────────────────── */
const _SAVE_KEY='tripwise_saves';
function getSavedTrips(){ try{return JSON.parse(localStorage.getItem(_SAVE_KEY)||'[]');}catch{return [];} }
function saveTrip(){
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  const name=dest?`${dest.name}, ${dest.country}`:'My Trip';
  const snap={...S,agentEventLog:[],loading:false,error:'',info:'',_confettiFired:false};
  const saves=getSavedTrips();
  saves.unshift({name,date:`${S.budget.dateFrom} – ${S.budget.dateTo}`,savedAt:new Date().toLocaleString(),state:snap});
  if(saves.length>12) saves.pop();
  localStorage.setItem(_SAVE_KEY,JSON.stringify(saves));
  const btn=document.getElementById('saveTripBtn');
  if(btn){btn.textContent='✅ Saved!';btn.classList.add('success');setTimeout(()=>{btn.textContent='💾 Save Trip';btn.classList.remove('success');},2200);}
}
function deleteSavedTrip(idx,ev){
  ev.stopPropagation();
  const saves=getSavedTrips(); saves.splice(idx,1);
  localStorage.setItem(_SAVE_KEY,JSON.stringify(saves));
  renderSavedTripsModal();
}
function loadSavedTrip(idx){
  const saves=getSavedTrips(); if(!saves[idx]) return;
  Object.assign(S,saves[idx].state);
  closeSavedTripsModal(); render();
  if(PHASES[S.phase].id==="summary"){ setTimeout(initTripMap,50); startLocalTime(); }
}
function showSavedTripsModal(){
  document.getElementById('savedTripsModal').style.display='flex';
  renderSavedTripsModal();
}
function closeSavedTripsModal(){ document.getElementById('savedTripsModal').style.display='none'; }
function renderSavedTripsModal(){
  const saves=getSavedTrips();
  const el=document.getElementById('savedTripsContent'); if(!el) return;
  if(!saves.length){
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--fg-dim);font-size:13px">No saved trips yet.<br>Complete a trip and hit 💾 Save Trip.</div>';
    return;
  }
  el.innerHTML=saves.map((t,i)=>`
    <div class="saved-trip-item" onclick="loadSavedTrip(${i})">
      <div style="flex:1;min-width:0">
        <div class="saved-trip-name">✈️ ${esc(t.name)}</div>
        <div class="saved-trip-meta">📅 ${esc(t.date)} · ${esc(t.savedAt)}</div>
      </div>
      <button class="saved-trip-del" onclick="deleteSavedTrip(${i},event)" title="Delete">🗑</button>
    </div>`).join('');
}
