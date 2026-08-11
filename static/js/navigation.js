/* ── navigation ───────────────────────────────────────────────────── */
function setPhase(p){
  S.phase=p; S.error=""; S.info=""; render();
  window.scrollTo({top:0,behavior:"smooth"});
  if(PHASES[p]?.id==="summary"){ setTimeout(fireConfetti,400); startLocalTime(); startCountdown(); }
}
function selectServer(mode){
  S.serverMode=mode;
  document.querySelectorAll(".server-pill").forEach(b=>b.classList.toggle("active",b.dataset.server===mode));
  const el=document.getElementById("serverStatus");
  if(el) el.textContent=SERVER_LABELS[mode]||mode;
}
function toggleInterest(i){
  const l=S.prefs.interests;
  S.prefs.interests=l.includes(i)?l.filter(x=>x!==i):[...l,i];
  render();
}
