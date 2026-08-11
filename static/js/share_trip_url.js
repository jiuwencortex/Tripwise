/* ── Share trip URL ───────────────────────────────────────────────── */
function shareTrip(){
  try{
    const snap={...S,agentEventLog:[],loading:false,error:'',info:'',_confettiFired:false};
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
    const url=`${location.origin}${location.pathname}#trip=${encoded}`;
    navigator.clipboard.writeText(url).then(()=>{
      const btn=document.getElementById('shareTripBtn');
      if(btn){btn.textContent='✅ Link Copied!';btn.classList.add('success');setTimeout(()=>{btn.textContent='🔗 Share Trip';btn.classList.remove('success');},2500);}
    }).catch(()=>alert('Copy manually:\n'+url));
  }catch(e){alert('Could not generate share link.');}
}
function _loadFromHash(){
  try{
    if(!location.hash.startsWith('#trip=')) return;
    const state=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(6)))));
    Object.assign(S,state);
    history.replaceState(null,'',location.pathname);
  }catch(e){console.warn('Could not restore trip from URL:',e);}
}
