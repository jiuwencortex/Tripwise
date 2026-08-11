/* ── task launchers ───────────────────────────────────────────────── */
function skipFlights(){
  S.flights=[]; S.selectedFlight=null; S.flightsSkipped=true;
  S.weather=null; S.tripTimezone=null; S.currencyRate=null; S.destHeroImage=null;
  fetchDestWeather(); fetchCurrencyRate(); fetchDestHeroImage();
  S.phase=4; render();
}
function skipHotels(){
  S.hotels=[]; S.selectedHotel=null; S.hotelsSkipped=true;
  S.phase=5; render();
}
function skipCarRental(){
  S.carRentals=[]; S.selectedCar=-1; S.carSkipped=true;
  S.phase=6; render();
}
function skipAttractions(){
  S.attractions=[]; S.selectedAttractions=[]; S.attractionsSkipped=true;
  S.attractionImages={}; S.phase=8;
  generateItinerary();
}
function findDestinations(){
  const prevPhase=S.phase;
  S.phase=3; S.selectedDest=null; S.lastFailedTask="findDestinations";
  runTask("destinations",d=>{S.destinations=d;S.lastFailedTask=null;},()=>S.phase=prevPhase);
}
function findFlights(){
  const prevPhase=S.phase;
  S.phase=4; S.selectedFlight=null; S.flightsSkipped=false; S.lastFailedTask="findFlights";
  S.weather=null; S.tripTimezone=null; S.currencyRate=null; S.destHeroImage=null;
  fetchDestWeather(); fetchCurrencyRate(); fetchDestHeroImage();
  runTask("flights",d=>{S.flights=d;S.lastFailedTask=null;},()=>S.phase=prevPhase);
}
function findHotels(){
  const prevPhase=S.phase;
  S.phase=5; S.selectedHotel=null; S.hotelsSkipped=false; S.lastFailedTask="findHotels";
  S.hotelImages={};
  runTask("hotels",d=>{S.hotels=d;S.lastFailedTask=null;fetchHotelImages();},()=>S.phase=prevPhase);
}
function findCarRentals(){
  const prevPhase=S.phase;
  S.phase=6; S.selectedCar=null; S.carSkipped=false; S.lastFailedTask="findCarRentals";
  S.carImages={};
  runTask("carrental",d=>{S.carRentals=d;S.lastFailedTask=null;fetchCarImages();},()=>S.phase=prevPhase);
}
function findAttractions(){
  const prevPhase=S.phase;
  S.phase=7; S.selectedAttractions=[]; S.attractionImages={}; S.attractionsSkipped=false; S.lastFailedTask="findAttractions";
  runTask("attractions",d=>{S.attractions=d;S.lastFailedTask=null;fetchAttractionImages();},()=>S.phase=prevPhase);
}
function generateItinerary(){
  const prevPhase=S.phase;
  S.phase=8; S.lastFailedTask="generateItinerary";
  runTask("itinerary",d=>{S.itinerary=d;S.lastFailedTask=null;},()=>S.phase=prevPhase);
}
