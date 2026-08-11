/* ── render helpers ───────────────────────────────────────────────── */
function renderStepper(){
  document.getElementById("stepper").innerHTML=PHASES.map((p,i)=>{
    const cls=i===S.phase?"step active":i<S.phase?"step done":"step";
    const click=i<S.phase?`onclick="setPhase(${i})"`:"";
    return `<div class="${cls}" ${click}><span>${p.icon}</span>${esc(p.label)}${i<S.phase?'<span style="font-size:10px">✓</span>':""}</div>`;
  }).join("");
}
function bindInputs(){
  document.querySelectorAll("[data-bind]").forEach(el=>{
    const handler=e=>{
      const [sec,key]=e.target.dataset.bind.split(".");
      let v=e.target.value;
      if(e.target.type==="number") v=v===""?"":Number(v);
      S[sec][key]=v;
      if(sec==="profile"&&key==="children") render();
      else if(e.type==="change") render();
    };
    el.addEventListener("input",handler);
    el.addEventListener("change",handler);
  });
}
function msgs(){
  let errorHtml="";
  if(S.error){
    const retryBtn=S.lastFailedTask?`<button class="btn small" onclick="${S.lastFailedTask}()" style="margin-top:12px">🔄 Try Again</button>`:"";
    errorHtml=`<div class="notice">
      <div style="font-weight:700;margin-bottom:8px">⚠️ Task Failed</div>
      <div>${esc(S.error)}</div>
      ${retryBtn}
    </div>`;
  }
  const infoHtml=S.info?`<div class="okbox">✅ ${esc(S.info)}</div>`:"";
  return errorHtml+infoHtml;
}
function loader(){
  return `<div class="loader">
    <div class="loader-top" style="gap:16px">
      <div class="spinner"></div>
      <span style="font-size:22px;font-weight:800;font-family:var(--heading)">Working on <span style="color:var(--accent)">${esc(PHASES[S.phase]?.label||"")}</span></span>
    </div>
    <div style="margin-top:6px;font-size:14px;color:var(--fg-dim);text-align:center">via ${esc(SERVER_LABELS[S.serverMode]||S.serverMode)}</div>
    <div style="margin-top:20px;font-size:12px;color:#6b7280;text-align:center">💡 Watch the Agent Activity panel on the right for live updates</div>
  </div>`;
}
