/* ── trip map (Leaflet) ───────────────────────────────────────────── */
let _mapInstance=null;

function _makeMarkerIcon(color,label){
  return L.divIcon({
    className:"",
    html:`<div style="background:${color};width:28px;height:28px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.5)">${label}</div>`,
    iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16]
  });
}

async function initTripMap(){
  const mapEl=document.getElementById("tripMap");
  if(!mapEl) return;
  if(_mapInstance){_mapInstance.remove();_mapInstance=null;}

  const points=[];
  // Itinerary activity points (have lat/lng) — skip items at the flight origin city
  const originCity=(S.profile.origin||'').split(',')[0].trim().toLowerCase();
  if(S.itinerary&&S.itinerary.days){
    S.itinerary.days.forEach((day,di)=>{
      (day.items||[]).forEach(item=>{
        if(item.lat&&item.lng){
          // Skip points located in the departure city (e.g. "Fly from Paris")
          const itemLoc=(item.location||'').toLowerCase();
          if(originCity&&itemLoc.includes(originCity)) return;
          points.push({lat:item.lat,lng:item.lng,label:item.activity,location:item.location||'',time:item.time||'',cost:item.cost||0,notes:item.notes||'',day:di+1,type:"activity"});
        }
      });
    });
  }

  if(points.length===0){mapEl.style.height="0";return;}

  _mapInstance=L.map(mapEl,{zoomControl:true,scrollWheelZoom:false});
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{
    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:"abcd",maxZoom:19
  }).addTo(_mapInstance);

  // Activity markers — numbered per day with rich popups
  const dayCounts={};
  points.forEach((p,idx)=>{
    const color=_DAY_COLORS[(p.day-1)%_DAY_COLORS.length];
    dayCounts[p.day]=(dayCounts[p.day]||0)+1;
    const seq=dayCounts[p.day];
    const seqLabel=seq<=9?String(seq):'…';
    const costStr=p.cost>0?`<br>💰 ${p.cost} ${S.budget.currency}`:'';
    const timeStr=p.time?`<br>⏰ ${p.time}`:'';
    const noteStr=p.notes?`<br><em style="color:#888;font-size:11px">${p.notes}</em>`:'';
    L.marker([p.lat,p.lng],{icon:_makeMarkerIcon(color,seqLabel)})
      .addTo(_mapInstance)
      .bindPopup(`<div style="min-width:160px"><strong style="color:${color}">Day ${p.day}</strong>${timeStr}<br><strong>${p.label}</strong><br><span style="color:#888;font-size:11px">📍 ${p.location||''}</span>${costStr}${noteStr}</div>`);
  });

  // Hotel marker via Nominatim (async, adds after map loads)
  const ht=S.selectedHotel!=null?S.hotels[S.selectedHotel]:null;
  const dest=S.destinations[S.selectedDest];
  if(ht&&dest){
    const q=`${ht.name}, ${ht.neighborhood||""}, ${dest.name}, ${dest.country}`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      {headers:{"Accept-Language":"en"}})
      .then(r=>r.json()).then(data=>{
        if(data&&data[0]&&_mapInstance){
          L.marker([parseFloat(data[0].lat),parseFloat(data[0].lon)],
            {icon:_makeMarkerIcon("#ffffff","🏨")})
            .addTo(_mapInstance)
            .bindPopup(`<strong>🏨 ${esc(ht.name)}</strong><br>${esc(ht.neighborhood)}`);
        }
      }).catch(()=>{});
  }

  // Smart zoom: focus on the main cluster, ignoring isolated outliers
  const allLLs=points.map(p=>[p.lat,p.lng]);
  const centerLat=allLLs.reduce((s,p)=>s+p[0],0)/allLLs.length;
  const centerLng=allLLs.reduce((s,p)=>s+p[1],0)/allLLs.length;
  const withDist=allLLs.map(p=>({ll:p,d:Math.sqrt((p[0]-centerLat)**2+(p[1]-centerLng)**2)}));
  const sorted=[...withDist].sort((a,b)=>a.d-b.d);
  // Use lower-median index so an outlier doesn't inflate the threshold (fixes 2-point case)
  const median=sorted[Math.floor((sorted.length-1)/2)].d;
  // Keep points within 2.5× median distance — removes isolated day-trip outliers
  const clustered=median>0?withDist.filter(p=>p.d<=median*2.5).map(p=>p.ll):allLLs;
  const boundsPoints=clustered.length>=2?clustered:allLLs;
  _mapInstance.fitBounds(L.latLngBounds(boundsPoints),{padding:[30,30]});
}

// Force Leaflet to re-render when print dialog opens (tiles + size recalculation)
window.addEventListener("beforeprint",()=>{
  if(_mapInstance){
    setTimeout(()=>{
      _mapInstance.invalidateSize();
      const points=[];
      if(S.itinerary&&S.itinerary.days){
        S.itinerary.days.forEach((day,di)=>{
          (day.items||[]).forEach(item=>{
            if(item.lat&&item.lng) points.push([item.lat,item.lng]);
          });
        });
      }
      if(points.length) _mapInstance.fitBounds(L.latLngBounds(points),{padding:[30,30]});
    },200);
  }
});
