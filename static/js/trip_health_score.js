/* ── Trip Health Score ───────────────────────────────────────────────── */
function _computeHealthScore(){
  const nd=S.budget.dateFrom&&S.budget.dateTo?days(S.budget.dateFrom,S.budget.dateTo):0;
  const fl=S.selectedFlight!=null?S.flights[S.selectedFlight]:null;
  const ht=S.selectedHotel!=null?S.hotels[S.selectedHotel]:null;
  const cr=S.selectedCar!=null&&S.selectedCar>=0?S.carRentals[S.selectedCar]:null;
  const tv=Number(S.profile.adults||0)+Number(S.profile.children||0);
  const tf=fl?fl.price*tv:0, th=ht?ht.pricePerNight*Math.max(0,nd-1):0;
  const tc=cr?cr.pricePerDay*nd:0;
  const ta=S.selectedAttractions.reduce((s,i)=>s+(S.attractions[i]?.estimatedCost||0),0)*tv;
  const spent=tf+th+tc+ta;
  const bgt=Number(S.budget.total||0);

  // Budget fitness (0–30)
  let budgetPts=0;
  if(bgt>0){
    const ratio=spent/bgt;
    if(ratio<=0.7) budgetPts=30;
    else if(ratio<=0.9) budgetPts=25;
    else if(ratio<=1.0) budgetPts=20;
    else if(ratio<=1.1) budgetPts=10;
    else budgetPts=0;
  }

  // Activity variety (0–25): reward picking 3+ attractions of different types
  const numActs=S.selectedAttractions.length;
  const actTypes=new Set(S.selectedAttractions.map(i=>S.attractions[i]?.type).filter(Boolean));
  let actPts=Math.min(25, numActs*5 + actTypes.size*3);

  // Duration balance (0–20): 4-12 days is ideal
  let durPts=0;
  if(nd>=4&&nd<=12) durPts=20;
  else if(nd>=3&&nd<=14) durPts=15;
  else if(nd>=2&&nd<=20) durPts=8;
  else if(nd>0) durPts=4;

  // Weather comfort (0–25)
  let wxPts=12; // default mid score
  const w=S.weather;
  if(w&&w.days&&w.days.length>0){
    const avg=w.days.reduce((s,d)=>s+(d.maxTemp+d.minTemp)/2,0)/w.days.length;
    const rainDays=w.days.filter(d=>d.precip>30).length;
    const rainRatio=rainDays/w.days.length;
    // Ideal: 18-28°C, low rain
    const tempScore=avg>=18&&avg<=28?25:avg>=12&&avg<=32?18:avg>=5&&avg<=36?10:5;
    const rainScore=rainRatio<0.2?0:rainRatio<0.4?-5:rainRatio<0.6?-10:-15;
    wxPts=Math.max(0,tempScore+rainScore);
  }

  const total=Math.min(100,budgetPts+actPts+durPts+wxPts);
  return{total,budgetPts,actPts,durPts,wxPts};
}

function renderTripBudgetScore(){
  const { budgetPts } = _computeHealthScore();
  const color =
    budgetPts >= 25 ? '#2A9D8F' :
    budgetPts >= 15 ? '#E9C46A' :
    '#ff8b7a';

  const bar = (pts, max, col) => `
    <div class="health-bar-track"
         style="flex:1; margin:0 12px;">
      <div class="health-bar-fill"
           style="
             width:${Math.round(pts/max*100)}%;
             background:${col};
             height:4px;
             border-radius:4px;
           ">
      </div>
    </div>
  `;

  return `
    <div class="card" style="padding:16px;">
      <div class="health-bar-row"
           style="display:flex; align-items:center; width:100%;">
        
        <!-- LABEL -->
        <span style="
          font-size:14px;
          font-weight:700;
          white-space:nowrap;
          margin-right:12px;
        ">
          💰 Budget Score
        </span>

        <!-- BAR -->
        ${bar(budgetPts, 30, color)}

        <!-- SCORE -->
        <span style="
          color:${color};
          font-weight:700;
          font-size:14px;
          white-space:nowrap;
          margin-left:12px;
        ">
          ${budgetPts}/30
        </span>

      </div>
    </div>
  `;
}

function renderTripHealthScore(){
  const{total,budgetPts,actPts,durPts,wxPts}=_computeHealthScore();
  const nd=S.budget.dateFrom&&S.budget.dateTo?days(S.budget.dateFrom,S.budget.dateTo):0;
  const bgt=Number(S.budget.total||0);
  const fl=S.selectedFlight!=null?S.flights[S.selectedFlight]:null;
  const ht=S.selectedHotel!=null?S.hotels[S.selectedHotel]:null;
  const cr=S.selectedCar!=null&&S.selectedCar>=0?S.carRentals[S.selectedCar]:null;
  const tv=Number(S.profile.adults||0)+Number(S.profile.children||0);
  const tf=fl?fl.price*tv:0,th=ht?ht.pricePerNight*Math.max(0,nd-1):0;
  const tc=cr?cr.pricePerDay*nd:0;
  const ta=S.selectedAttractions.reduce((s,i)=>s+(S.attractions[i]?.estimatedCost||0),0)*tv;
  const spent=tf+th+tc+ta;
  const spentPct=bgt>0?Math.round(spent/bgt*100):0;
  const numActs=S.selectedAttractions.length;
  const actTypes=new Set(S.selectedAttractions.map(i=>S.attractions[i]?.type).filter(Boolean));
  const{badge,label,color}=
    total>=80?{badge:'🟢',label:'Excellent Trip!',color:'#2A9D8F'}:
    total>=60?{badge:'🟡',label:'Good Trip',color:'#E9C46A'}:
    total>=40?{badge:'🟠',label:'Fair Trip',color:'#F4A261'}:
              {badge:'🔴',label:'Needs Attention',color:'#ff8b7a'};
  const bar=(pts,max,col)=>`<div class="health-bar-track" style="flex:1;margin:0 8px"><div class="health-bar-fill" style="width:${Math.round(pts/max*100)}%;background:${col}"></div></div>`;
  const row=(icon,name,pts,max,col,hint)=>`
    <div style="margin-bottom:10px">
      <div class="health-bar-row">
        <span class="health-bar-name">${icon} ${name}</span>
        ${bar(pts,max,col)}
        <span style="color:${col};font-weight:700;font-size:12px;white-space:nowrap">${pts}/${max} pts</span>
      </div>
      <div style="font-size:10px;color:var(--fg-dim);padding-left:80px;margin-top:1px;line-height:1.4">${hint}</div>
    </div>`;
  return `<div class="card">
    <div style="font-size:14px;font-weight:700;font-family:var(--heading);margin-bottom:14px">🏅 Trip Health Score <span style="font-size:11px;font-weight:400;color:var(--fg-dim)">(out of 100)</span></div>
    <div class="health-score-wrap">
      <div style="text-align:center;flex-shrink:0">
        <div class="health-badge">${badge}</div>
        <div class="health-score-num" style="color:${color}">${total}</div>
        <div class="health-label" style="color:${color}">${label}</div>
      </div>
      <div style="flex:1;min-width:180px">
        ${row('💰','Budget',budgetPts,30,color,
          bgt>0?`Spending ${spentPct}% of your budget — ideal is under 90% (leaves buffer)`:'No budget entered')}
        ${row('🎭','Activities',actPts,25,color,
          numActs>0?`${numActs} attraction${numActs!==1?'s':''} across ${actTypes.size} type${actTypes.size!==1?'s':''} — variety earns more points`:'No attractions selected')}
        ${row('📅','Duration',durPts,20,color,
          nd>0?`${nd}-day trip — sweet spot is 4–12 days for a full experience`:'No dates set')}
        ${row('🌤','Weather',wxPts,25,color,
          S.weather?`Avg temperature & rain days for your travel period (ideal: 18–28°C, low rain)`:'Weather not loaded yet')}
      </div>
    </div>
  </div>`;
}
