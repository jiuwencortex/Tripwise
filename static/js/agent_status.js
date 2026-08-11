/* ── agent status ─────────────────────────────────────────────────── */
function getEventClass(evt){
  // Agent dispatch events (calling an agent)
  if(evt.includes("🤖")||evt.includes("Agent call:"))return "agent-call";
  // Agent results (response from agent)
  if(evt.includes("📨")||evt.includes("Agent result:"))return "agent-result";
  // Tool-related events (actions the agent takes)
  if(evt.includes("🔍")||evt.includes("🌐")||evt.includes("🔧")||evt.includes("Using tool"))return "tool-call";
  // Tool results (data coming back from tools)
  if(evt.includes("📥")||evt.includes("Result:"))return "tool-result";
  // Agent responses (what the agent is saying/generating)
  if(evt.includes("💬")||evt.includes("Agent response")||evt.includes("✅")||evt.includes("Final answer"))return "agent-response";
  // System/connection events
  if(evt.includes("🔗")||evt.includes("📦")||evt.includes("Connecting")||evt.includes("Connected"))return "system";
  return "";
}
function _now24(){ return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); }

// Debounce timer for delta message flushing
let _deltaFlushTimer=null;
function _flushDelta(){
  _deltaFlushTimer=null;
  renderEvents();
}

function updateStatus(icon,text,evtType){
  S.agentStatus={icon,text};

  // Skip silently — no visible entry for compression notices
  if(evtType==="context.compressed"){ renderEvents(); return; }

  // If a non-delta arrives while a delta flush is pending — flush immediately
  if(evtType!=="chat.delta" && _deltaFlushTimer){
    clearTimeout(_deltaFlushTimer); _deltaFlushTimer=null;
    renderEvents(); // show the completed delta message
  }

  // Accumulate chat.delta fragments — debounce rendering by 1 second
  if(evtType==="chat.delta"){
    const last=S.agentEventLog.length>0?S.agentEventLog[S.agentEventLog.length-1]:null;
    if(last&&last.type==="chat.delta"){
      last.text+=text;
    } else {
      S.agentEventLog.push({icon,text,time:_now24(),type:"chat.delta",collapsed:false,streaming:false,id:Date.now()+Math.random()});
      if(S.agentEventLog.length>50) S.agentEventLog.shift();
    }
    // Reset debounce — render 1 second after last delta arrives
    if(_deltaFlushTimer) clearTimeout(_deltaFlushTimer);
    _deltaFlushTimer=setTimeout(_flushDelta,1000);
    return; // defer rendering
  }

  S.agentEventLog.push({
    icon, text,
    time:_now24(),
    type:evtType||"",
    collapsed:false,
    streaming:false,
    id:Date.now()+Math.random()
  });
  if(S.agentEventLog.length>50) S.agentEventLog.shift();

  // Auto-collapse older entries (keep last 4 open while loading, last 2 at rest)
  const expandedCount=S.loading?4:2;
  S.agentEventLog.forEach((e,i)=>{
    if(i<S.agentEventLog.length-expandedCount) e.collapsed=true;
  });
  renderEvents();
}
function toggleEvent(id){
  const evt=S.agentEventLog.find(e=>e.id===id);
  if(evt){
    evt.collapsed=!evt.collapsed;
    renderEvents();
  }
}
function renderEvents(){
  const el=document.getElementById("eventsScroll");
  const indicator=document.getElementById("statusIndicator");
  const counter=document.getElementById("eventCount");

  // Update status indicator
  if(indicator){
    indicator.classList.toggle("active",S.loading);
  }

  // Update event count
  if(counter){
    // const collapsed=S.agentEventLog.filter(e=>e.collapsed).length;
    // const expanded=S.agentEventLog.length-collapsed;
    // if(collapsed>0){
    //   counter.textContent=`${expanded}/${S.agentEventLog.length}`;
    //   counter.title=`${expanded} expanded, ${collapsed} collapsed`;
    // }else{
      counter.textContent=S.agentEventLog.length;
      counter.title=`${S.agentEventLog.length} events`;
    // }
  }

  if(!el)return;
  if(S.agentEventLog.length===0){
    el.innerHTML='<div class="events-empty"><div class="events-empty-icon">💭</div><div>Events will appear here as the agent works...</div></div>';
    return;
  }
  el.innerHTML=S.agentEventLog.map((e,i)=>{
    const cls=getEventClass(e.icon+e.text);
    const collapsedCls=e.collapsed?"collapsed":"";
    const isLatest=i===S.agentEventLog.length-1;
    const latestCls=isLatest?"latest":"";
    const displayText=esc(e.text);
    return `<div class="event-item ${cls} ${collapsedCls} ${latestCls}" onclick="toggleEvent(${e.id})">
      <div class="event-item-header">
        <div class="event-icon">${e.icon}</div>
        <div class="event-content">
          <div class="event-text">${displayText}</div>
          <div class="event-text-preview">${displayText}</div>
        </div>
        <div class="event-expand-icon">▼</div>
      </div>
      <div class="event-details">
        <div class="event-time">${e.time}</div>
      </div>
    </div>`;
  }).join("");
  el.scrollTop=el.scrollHeight;
}
function clearEvents(){
  S.agentEventLog=[];
  renderEvents();
}
function expandAll(){
  S.agentEventLog.forEach(e=>e.collapsed=false);
  renderEvents();
}
function collapseAll(){
  S.agentEventLog.forEach(e=>e.collapsed=true);
  renderEvents();
}
// Keyboard shortcuts
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='e'&&!e.ctrlKey&&!e.metaKey){
    expandAll();
    e.preventDefault();
  }
});

function parseSSEEvent(evtData){
  const evt=evtData.event||"";
  const p=evtData.payload||{};
  switch(evt){
    // System/Connection events
    case "connection.start":  return {icon:"🔗",text:`Connecting to backend...`};
    case "connection.ack":    return {icon:"🔗",text:`Connected successfully`};
    case "context.compressed": return {icon:"📦",text:`Context optimized (${p.after_compressed||0} tokens)`};
    case "res":               return {icon:"✅",text:p.accepted?"Session started":"Acknowledged"};

    // Agent thinking/processing
    case "chat.processing_status":
      return p.is_processing?{icon:"🤔",text:"Agent is thinking..."}:{icon:"✅",text:"Thinking complete"};
    case "chat.evolution_status":
      return p.status==="start"?{icon:"🧠",text:"Refining response..."}:{icon:"✅",text:"Response refined"};

    // Agent responses (what the agent generates)
    case "chat.delta":{
      const content=p.content||"";
      return {icon:"💬",text:content};
    }
    case "chat.final":{
      const finalContent=p.content||p.text||"";
      return {icon:"✅",text:finalContent?`Final answer: ${finalContent}`:"Response complete"};
    }

    // Tool usage (actions the agent takes)
    case "chat.tool_call":{
      const tc=p.tool_call||{};
      const name=tc.name||"tool";
      let args="";
      try{
        const parsed=JSON.parse(tc.arguments||"{}");
        // Show full arguments in a readable format
        args=JSON.stringify(parsed,null,2);
      }catch(_){
        args=tc.arguments||"";
      }
      const icon={free_search:"🔍",fetch_webpage:"🌐"}[name]||"🔧";
      return {icon,text:`Using tool: ${name}\n${args}`};
    }

    // Tool results (data coming back from tools)
    case "chat.tool_result":{
      const toolName=p.tool_name||"unknown";
      const result=p.result||p.content||p.output||"";
      const resultText=typeof result==="object"?JSON.stringify(result,null,2):String(result);
      return {icon:"📥",text:`Result: ${toolName}\n${resultText}`};
    }

    // Agent dispatch (delegating to a sub-agent)
    case "chat.agent_call":{
      const ac=p.agent_call||{};
      const name=ac.name||"agent";
      let args="";
      try{
        const parsed=JSON.parse(ac.arguments||"{}");
        args=JSON.stringify(parsed,null,2);
      }catch(_){
        args=ac.arguments||"";
      }
      return {icon:"🤖",text:`Agent call: ${name}\n${args}`};
    }

    // Agent result (response from sub-agent)
    case "chat.agent_result":{
      const agentName=p.agent_name||"unknown";
      const result=p.result||p.content||p.output||"";
      const resultText=typeof result==="object"?JSON.stringify(result,null,2):String(result);
      return {icon:"📨",text:`Agent result: ${agentName}\n${resultText}`};
    }

    // Unknown events
    default:{
      // Try to extract any content from unknown events
      const content=p.content||p.text||p.message||JSON.stringify(p);
      return {icon:"📡",text:`${evt||"event"}: ${content}`};
    }
  }
}
