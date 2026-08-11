const S = {
  phase: 0, loading: false, error: "", info: "",
  apiEndpoint: "/api/travel",
  serverMode: "jiuwenclaw",
  jiuwenclaw_mode: "agent.plan",  // agent.plan | agent.fast | team | code.plan | code.normal
  agentStatus: "", agentEventLog: [],
  lastFailedTask: null,
  profile:  { adults:"1", children:"1", childAges:"5", specialNeeds:"none", origin:"Paris" },
  budget:   { total:"2000", currency:"USD ($)", dateFrom:"2026-06-01", dateTo:"2026-06-03", flexibility:"±1 week" },
  prefs:    { interests:["Culture","Food"], style:"Mid-range comfort", priority:"Best experience" },
  destinations:[], selectedDest:null,
  flights:[],      selectedFlight:null, flightsSkipped:false,
  hotels:[],       selectedHotel:null,  hotelsSkipped:false,
  carRentals:[],   selectedCar:null,    carSkipped:false,
  attractions:[],  selectedAttractions:[], attractionsSkipped:false,
  itinerary:null,
  // ── new features ──
  weather:null, destCoords:null, tripTimezone:null, originTimezone:null, _confettiFired:false,
  currencyRate:null, packingChecked:{}, packingTab:'list', itineraryView:'list', voicePlaying:false,
  attractionImages:{}, hotelImages:{}, carImages:{}, flightImages:{}, destHeroImage:null,
  // user-configurable result counts (saved/loaded by settings_modal.js)
  numDestinations:2, numFlights:2, numHotels:2, numCarRentals:2, numAttractions:2,
};
