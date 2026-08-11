/* ── 5. Voice readout ────────────────────────────────────────────── */
function toggleVoiceReadout(){
  const synth=window.speechSynthesis;
  if(!synth){alert('Speech synthesis not supported in your browser.');return;}
  if(synth.speaking||synth.pending){synth.cancel();S.voicePlaying=false;render();return;}
  const it=S.itinerary; if(!it) return;
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  let txt=`Your travel itinerary for ${dest?dest.name+', '+dest.country:'your trip'}. ${it.summary||''}. `;
  (it.days||[]).forEach(day=>{
    txt+=`Day ${day.day}: ${day.title}. `;
    (day.items||[]).forEach(item=>{
      txt+=`At ${item.time.replace(':',' ')}, ${item.activity}. `;
      if(item.location) txt+=`At ${item.location}. `;
      if(item.notes) txt+=`${item.notes}. `;
    });
  });
  const u=new SpeechSynthesisUtterance(txt);
  u.rate=0.92;u.pitch=1;u.lang='en-US';
  u.onend=()=>{S.voicePlaying=false;render();};
  u.onerror=()=>{S.voicePlaying=false;render();};
  synth.speak(u);
  S.voicePlaying=true;render();
}
