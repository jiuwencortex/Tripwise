/* ── Confetti ─────────────────────────────────────────────────────── */
function fireConfetti(){
  if(S._confettiFired||typeof confetti==='undefined') return;
  S._confettiFired=true;
  const opts={colors:['#E76F51','#2A9D8F','#2cc7ff','#E9C46A','#F4A261','#a78bfa']};
  confetti({...opts,particleCount:70,spread:55,origin:{y:0.65}});
  setTimeout(()=>confetti({...opts,particleCount:35,spread:75,angle:60,origin:{y:0.6}}),350);
  setTimeout(()=>confetti({...opts,particleCount:35,spread:75,angle:120,origin:{y:0.6}}),420);
}
