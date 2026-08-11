/* ── Local time live clock + dual clock ──────────────────────────── */
let _ltInterval=null;
let _originTzFetching=false;
async function _ensureOriginTimezone(){
  if(S.originTimezone||_originTzFetching||!S.profile.origin) return;
  _originTzFetching=true;
  try{
    const g=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(S.profile.origin)}&format=json&limit=1`,{headers:{"Accept-Language":"en"}});
    const gd=await g.json();
    if(gd&&gd[0]){
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${gd[0].lat}&longitude=${gd[0].lon}&daily=temperature_2m_max&forecast_days=1&timezone=auto`);
      const rd=await r.json();
      if(rd.timezone) S.originTimezone=rd.timezone;
    }
  }catch(e){console.warn('Origin TZ fetch:',e);}
  _originTzFetching=false;
}
function startLocalTime(){
  _ensureOriginTimezone();
  if(_ltInterval) clearInterval(_ltInterval);
  _ltInterval=setInterval(()=>{
    const now=new Date();
    // Destination clock
    if(S.tripTimezone){
      const el=document.getElementById('localTimeClock');
      if(el) el.textContent=new Intl.DateTimeFormat('en',{timeZone:S.tripTimezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
    }
    // Home clock (origin city time, or browser local time as fallback)
    const hel=document.getElementById('homeTimeClock');
    if(hel){
      if(S.originTimezone){
        hel.textContent=new Intl.DateTimeFormat('en',{timeZone:S.originTimezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
      } else {
        hel.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
      }
    }
    // Stop if both are gone
    if(!document.getElementById('localTimeClock')&&!document.getElementById('homeTimeClock')){
      clearInterval(_ltInterval); _ltInterval=null;
    }
  },1000);
}

function renderDualClock(){
  if(!S.tripTimezone) return '';
  const dest=S.destinations[S.selectedDest];
  const homeTz=Intl.DateTimeFormat().resolvedOptions().timeZone||'Local';
  const homeCity=S.profile.origin||'Home';
  return `<div class="card">
    <div style="font-size:14px;font-weight:700;font-family:var(--heading);margin-bottom:14px">🕐 Live Clocks</div>
    <div class="dual-clock">
      <div class="clock-box" style="border-right:1px solid var(--border)">
        <div class="clock-label">🏠 Departure</div>
        <div class="clock-time" id="homeTimeClock">--:--:--</div>
        <div class="clock-city">${esc(homeCity)}</div>
      </div>
      <div class="clock-box">
        <div class="clock-label">🌍 Destination</div>
        <div class="clock-time" id="localTimeClock">--:--:--</div>
        <div class="clock-city">${esc(dest?.name||S.tripTimezone)}</div>
      </div>
    </div>
  </div>`;
}