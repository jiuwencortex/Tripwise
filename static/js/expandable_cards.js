/* ── expandable cards ─────────────────────────────────────────────── */
const _expanded=new Set();
function toggleExpand(key){
  if(_expanded.has(key)) _expanded.delete(key); else _expanded.add(key);
  render();
  if(PHASES[S.phase].id==="summary") setTimeout(initTripMap,50);
}
