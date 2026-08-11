/* ── API call ─────────────────────────────────────────────────────── */
async function callBackend(task){
  const d=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  const selAttr=S.selectedAttractions.map(i=>S.attractions[i]).filter(Boolean);
  S.agentEventLog=[];
  S.agentStatus={icon:"🔗",text:"Connecting..."};
  render();

  const res=await fetch(S.apiEndpoint+"/stream",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      task,
      serverMode: S.serverMode,
      jiuwenclaw_mode: S.jiuwenclaw_mode,
      context: buildContextText(),
      currency: S.budget.currency,
      dest_name: d?`${d.name}, ${d.country}`:"",
      num_days: days(S.budget.dateFrom,S.budget.dateTo),
      selected_attractions: task==="itinerary"?selAttr:[],
      num_destinations: S.numDestinations||2,
      num_flights: S.numFlights||2,
      num_hotels: S.numHotels||2,
      num_car_rentals: S.numCarRentals||2,
      num_attractions: S.numAttractions||2,
    }),
  });
  if(!res.ok) throw new Error("Backend error: "+(await res.text()));
  if(!res.body) throw new Error("Response body is null");

  const reader=res.body.getReader();
  const dec=new TextDecoder();
  let buf="",finalData=null;

  while(true){
    const {done,value}=await reader.read();
    if(done) break;
    buf+=dec.decode(value,{stream:true});
    const lines=buf.split("\n");
    buf=lines.pop();
    for(const line of lines){
      if(!line.startsWith("data: ")) continue;
      const raw=line.slice(6).trim();
      if(!raw) continue;
      try{
        const e=JSON.parse(raw);
        if(e._type==="done"){ finalData=e.data; }
        else if(e._type==="error"){ throw new Error(e.message||"Stream error"); }
        else{ const {icon,text}=parseSSEEvent(e); updateStatus(icon,text,e.event); }
      }catch(err){
        if(err.message&&!err.message.includes("JSON")) throw err;
      }
    }
  }
  if(finalData==null) throw new Error("No final data from stream.");
  const parsed=parseJSON(finalData);
  if(parsed==null) throw new Error("Could not parse response. finalData=" + JSON.stringify(finalData));
  return parsed;
}

async function runTask(task,onSuccess,onError){
  S.loading=true; S.error=""; S.info=""; render();
  startTimer();
  try{
    const data=await callBackend(task);
    onSuccess(data);
    stopTimer();
    collapseAll();
  }
  catch(err){
    stopTimer();
    S.error=err.message||String(err);
    if(onError) onError(err);
  }
  finally{
    S.loading=false;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
}
