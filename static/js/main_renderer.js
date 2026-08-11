/* ── main render ──────────────────────────────────────────────────── */
function renderCurrent(){
  if(S.loading) return loader();
  switch(PHASES[S.phase].id){
    case "profile":       return renderProfile();
    case "budget":        return renderBudget();
    case "preferences":   return renderPreferences();
    case "destinations":  return renderDestinations();
    case "flights":       return renderFlights();
    case "accommodation": return renderHotels();
    case "carrental":     return renderCars();
    case "attractions":   return renderAttractions();
    case "itinerary":     return renderItinerary();
    case "summary":       return renderSummary();
    default: return "<div>Unknown phase</div>";
  }
}
function render(){
  renderStepper();
  renderContextBar();
  document.getElementById("app").innerHTML=msgs()+renderCurrent();
  bindInputs();
  const onSummary=PHASES[S.phase].id==="summary";
  const pane=document.querySelector(".events-pane");
  if(pane) pane.style.display=onSummary?"none":"flex";
  const container=document.querySelector(".container");
  if(container) container.classList.toggle("summary-full",onSummary);
  const contentEl=document.querySelector(".content");
  if(contentEl) contentEl.classList.toggle("summary-mode",onSummary);
  if(!onSummary) renderEvents();
  if(onSummary){ setTimeout(initTripMap,50); startLocalTime(); startCountdown(); }
}
_loadFromHash();
render();