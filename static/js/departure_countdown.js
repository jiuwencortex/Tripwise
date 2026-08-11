/* ── 1. Departure countdown ──────────────────────────────────────── */
let _countdownInterval=null;
function _countdownText(){
  if(!S.budget.dateFrom) return null;
  const now=new Date();
  const today=new Date(); today.setHours(0,0,0,0);
  const dep=new Date(S.budget.dateFrom+'T00:00:00');
  const dayDiff=Math.round((dep-today)/86400000);
  if(dayDiff<0) return{text:`Trip was ${Math.abs(dayDiff)} days ago`,urgent:false};
  if(dayDiff===0) return{text:'Today is the day! ✈️',urgent:true};
  if(dayDiff===1) return{text:'Tomorrow! Pack your bags! 🎒',urgent:true};
  const diff=dep-now;
  if(diff<=0) return{text:'Bon voyage! ✈️',urgent:true};
  const ts=Math.floor(diff/1000);
  const d=Math.floor(ts/86400),h=Math.floor((ts%86400)/3600),m=Math.floor((ts%3600)/60),s=ts%60;
  if(d>7) return{text:`${d} days until your adventure`,urgent:false};
  if(d>2) return{text:`${d} days, ${h}hours until departure`,urgent:false};
  return{text:`${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`,urgent:d<3};
}
function startCountdown(){
  if(_countdownInterval) clearInterval(_countdownInterval);
  _countdownInterval=setInterval(()=>{
    const el=document.getElementById('departureCountdown');
    if(!el){clearInterval(_countdownInterval);_countdownInterval=null;return;}
    const info=_countdownText();
    if(info){el.textContent=info.text;el.className='countdown-value'+(info.urgent?' urgent':'');}
  },1000);
}
function renderCountdownCard(){
  if(!S.budget.dateFrom) return '';
  const info=_countdownText(); if(!info) return '';
  return `<div class="card countdown-card">
    <div class="countdown-label">⏳ Departure Countdown</div>
    <div class="countdown-value${info.urgent?' urgent':''}" id="departureCountdown">${info.text}</div>
    <div class="countdown-sub">📅 ${esc(S.budget.dateFrom)} → ${esc(S.budget.dateTo)}</div>
  </div>`;
}
