/* ── agent timer ─────────────────────────────────────────────────── */
let _timerInterval=null, _timerStart=null, _timerEnabled=false;

fetch("/api/config").then(r=>r.json()).then(cfg=>{
  _timerEnabled=!!(cfg.show_agent_timer);
}).catch(()=>{});

function _fmtElapsed(){
  if(!_timerStart) return "0:00";
  const s=Math.floor((Date.now()-_timerStart)/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}
function _updateTimerEl(cls){
  const el=document.getElementById("agentTimer");
  if(!el) return;
  if(!_timerEnabled){ el.className="agent-timer"; return; }
  el.textContent=_fmtElapsed();
  el.className="agent-timer "+cls;
}
function startTimer(){
  if(!_timerEnabled) return;
  _timerStart=Date.now();
  if(_timerInterval) clearInterval(_timerInterval);
  _timerInterval=setInterval(()=>_updateTimerEl("running"),1000);
  _updateTimerEl("running");
}
function stopTimer(){
  if(_timerInterval){ clearInterval(_timerInterval); _timerInterval=null; }
  _updateTimerEl("stopped");
}
