/* ── WMO weather codes → icon/label ──────────────────────────────── */
const WMO={
  0:{i:"☀️",l:"Clear"},1:{i:"🌤",l:"Mainly clear"},2:{i:"⛅",l:"Partly cloudy"},3:{i:"☁️",l:"Overcast"},
  45:{i:"🌫",l:"Foggy"},48:{i:"🌫",l:"Foggy"},
  51:{i:"🌦",l:"Drizzle"},53:{i:"🌦",l:"Drizzle"},55:{i:"🌧",l:"Drizzle"},
  61:{i:"🌧",l:"Rain"},63:{i:"🌧",l:"Rain"},65:{i:"🌧",l:"Heavy rain"},
  71:{i:"🌨",l:"Snow"},73:{i:"❄️",l:"Snow"},75:{i:"❄️",l:"Heavy snow"},
  80:{i:"🌦",l:"Showers"},81:{i:"🌦",l:"Showers"},82:{i:"⛈",l:"Showers"},
  85:{i:"🌨",l:"Snow showers"},86:{i:"🌨",l:"Snow showers"},
  95:{i:"⛈",l:"Thunderstorm"},96:{i:"⛈",l:"Thunderstorm"},99:{i:"⛈",l:"Thunderstorm"},
};
const _wmo=code=>(WMO[code]||WMO[0]);

/* ── Weather fetch ────────────────────────────────────────────────── */
async function fetchDestWeather(){
  const dest=S.destinations[S.selectedDest];
  if(!dest||!S.budget.dateFrom||!S.budget.dateTo) return;
  try{
    const geo=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dest.name+', '+dest.country)}&format=json&limit=1`,{headers:{"Accept-Language":"en"}});
    const geoData=await geo.json();
    if(!geoData||!geoData[0]) return;
    const lat=parseFloat(geoData[0].lat), lng=parseFloat(geoData[0].lon);
    S.destCoords={lat,lng};

    const today=new Date(); today.setHours(0,0,0,0);
    const fromDate=new Date(S.budget.dateFrom);
    const daysUntil=Math.floor((fromDate-today)/86400000);
    const isForecast=daysUntil<=15;

    const _fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    let url; const isHistorical=!isForecast;
    if(isForecast){
      url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${S.budget.dateFrom}&end_date=${S.budget.dateTo}`;
    } else {
      const ly1=new Date(fromDate); ly1.setFullYear(ly1.getFullYear()-1);
      const ly2=new Date(S.budget.dateTo); ly2.setFullYear(ly2.getFullYear()-1);
      url=`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&start_date=${_fmt(ly1)}&end_date=${_fmt(ly2)}`;
    }
    const res=await fetch(url);
    const data=await res.json();
    if(!data.daily) return;
    S.tripTimezone=data.timezone||null;
    // Fetch origin city timezone so home clock shows correct local time
    if(S.profile.origin&&!S.originTimezone){
      try{
        const origGeo=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(S.profile.origin)}&format=json&limit=1`,{headers:{"Accept-Language":"en"}});
        const origData=await origGeo.json();
        if(origData&&origData[0]){
          const olat=parseFloat(origData[0].lat),olng=parseFloat(origData[0].lon);
          const origTzRes=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${olat}&longitude=${olng}&daily=temperature_2m_max&forecast_days=1&timezone=auto`);
          const origTzData=await origTzRes.json();
          S.originTimezone=origTzData.timezone||null;
        }
      }catch(e){console.warn('Origin timezone fetch failed:',e);}
    }
    const d=data.daily;
    S.weather={
      isForecast,
      timezone:data.timezone||null,
      days:(d.time||[]).slice(0,14).map((date,i)=>({
        date, code:d.weathercode?.[i]??0,
        maxTemp:Math.round(d.temperature_2m_max?.[i]??0),
        minTemp:Math.round(d.temperature_2m_min?.[i]??0),
        precip:isHistorical?Math.round(d.precipitation_sum?.[i]??0):Math.round(d.precipitation_probability_max?.[i]??0),
        precipLabel:isHistorical?'mm':'%',
      })),
    };
    render();
    if(PHASES[S.phase].id==="summary") setTimeout(initTripMap,50);
  }catch(e){ console.warn('Weather fetch failed:',e); }
}

function renderWeatherCard(){
  const dest=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  if(!dest) return '';
  let ltHtml='';
  if(S.tripTimezone&&dest){
    // Use destination name, not IANA timezone city (avoids showing "Madrid" for Barcelona etc.)
    ltHtml=`<div class="local-time-chip">🌐 ${esc(dest.name)}</div>`;
  }
  if(!S.weather){
    return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-size:14px;font-weight:700;font-family:var(--heading)">🌤 Loading weather…</div>
      ${ltHtml}
    </div>`;
  }

  if(!S.weather.isForecast){
    // Historical data: show a compact temperature range — no day-by-day (not meaningful far out)
    const wdays=S.weather.days;
    if(!wdays||wdays.length===0) return '';
    const absMin=Math.min(...wdays.map(d=>d.minTemp));
    const absMax=Math.max(...wdays.map(d=>d.maxTemp));
    const avgMax=Math.round(wdays.reduce((s,d)=>s+d.maxTemp,0)/wdays.length);
    const avgMin=Math.round(wdays.reduce((s,d)=>s+d.minTemp,0)/wdays.length);
    const avgPrecip=Math.round(wdays.reduce((s,d)=>s+d.precip,0)/wdays.length);
    const codeCounts={};
    wdays.forEach(d=>{ codeCounts[d.code]=(codeCounts[d.code]||0)+1; });
    const dominantCode=parseInt(Object.entries(codeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]??0);
    const wIcon=_wmo(dominantCode).i;
    const wLabel=_wmo(dominantCode).l;
    return `<div class="card">
      <div style="font-size:14px;font-weight:700;font-family:var(--heading);margin-bottom:12px">🌤 Historical Climate — ${esc(dest.name)}</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
        <div style="text-align:center">
          <div style="font-size:40px">${wIcon}</div>
          <div style="font-size:11px;color:var(--fg-dim);margin-top:2px">${wLabel}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--fg-dim);margin-bottom:3px">Typical temperature range</div>
          <div style="font-size:26px;font-weight:800;font-family:var(--heading)">${avgMin}° – ${avgMax}°</div>
          <div style="font-size:11px;color:var(--fg-dim)">Record range: ${absMin}° to ${absMax}°</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--fg-dim);margin-bottom:3px">Avg. precipitation</div>
          <div style="font-size:20px;font-weight:700;font-family:var(--heading)">💧 ${avgPrecip} mm/day</div>
        </div>
      </div>
      <div class="weather-note" style="margin-top:12px">📊 Trip is more than 2 weeks out — showing a historical temperature range from the same period last year. Day-by-day forecasts aren't reliable this far ahead.</div>
    </div>`;
  }

  // Forecast (≤15 days out): show normal day-by-day view
  const daysHtml=S.weather.days.map(d=>{
    const dt=new Date(d.date+'T12:00:00');
    const lbl=dt.toLocaleDateString('en',{weekday:'short',month:'numeric',day:'numeric'});
    return `<div class="weather-day">
      <div class="w-icon">${_wmo(d.code).i}</div>
      <div class="w-date">${lbl}</div>
      <div class="w-temp">${d.maxTemp}° <span style="font-weight:400;color:var(--fg-dim)">${d.minTemp}°</span></div>
      <div class="w-precip">💧${d.precip}${d.precipLabel}</div>
    </div>`;
  }).join('');
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
      <div style="font-size:14px;font-weight:700;font-family:var(--heading)">🌤 Forecast for ${esc(dest.name)}</div>
      ${ltHtml}
    </div>
    <div class="weather-widget">${daysHtml||'<span style="color:var(--fg-dim);font-size:13px">No data available.</span>'}</div>
  </div>`;
}

function renderTripActions(){
  const hasIt=!!S.itinerary;
  const voiceLabel=S.voicePlaying?'⏹ Stop':'🗣 Read Aloud';
  return `<div class="trip-actions">
    <button id="saveTripBtn" class="trip-btn" onclick="saveTrip()">💾 Save Trip</button>
    <button id="shareTripBtn" class="trip-btn" onclick="shareTrip()">🔗 Share Link</button>
    <button class="trip-btn" onclick="shareWhatsApp()">💬 WhatsApp</button>
    <button class="trip-btn" onclick="shareEmail()">📧 Email</button>
    <button id="copyItinBtn" class="trip-btn" onclick="copyItinerary()" ${hasIt?'':'disabled'}>📋 Copy</button>
    <button class="trip-btn" onclick="showPackingModal()">🧳 Packing List</button>
    <button class="trip-btn" onclick="toggleVoiceReadout()" ${hasIt?'':'disabled'}>${voiceLabel}</button>
    <button class="trip-btn" onclick="window.print()">🖨 Print / PDF</button>
  </div>`;
}
