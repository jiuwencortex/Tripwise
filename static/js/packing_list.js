/* ── 6. Packing list ─────────────────────────────────────────────── */
function _generatePackingList(){
  const nd=S.budget.dateFrom&&S.budget.dateTo?days(S.budget.dateFrom,S.budget.dateTo):7;
  const acts=S.selectedAttractions.map(i=>S.attractions[i]).filter(Boolean);
  const atxt=acts.map(a=>(a.name+' '+(a.type||'')).toLowerCase()).join(' ');
  const w=S.weather;
  const avg=w?.days.length?Math.round(w.days.reduce((s,d)=>s+(d.maxTemp+d.minTemp)/2,0)/w.days.length):null;
  const rain=w?.days.some(d=>d.precip>35)??false;
  const cold=avg!==null?avg<15:false,hot=avg!==null?avg>27:false;
  const beach=/beach|swim|ocean|snorkel|pool|dive/.test(atxt);
  const hike=/hike|hiking|trail|trek|mountain/.test(atxt);
  const formal=/dinner|gala|theatre|theater|opera|fine dining/.test(atxt);
  const ski=/ski|snowboard|snow/.test(atxt);
  const n=Math.min;
  return{
    '📄 Documents & Money':[
      'Passport / National ID','Printed flight tickets','Hotel & booking confirmations',
      'Travel insurance documents','Credit cards + local cash',
      nd>5?'Email copies of all documents to yourself':null,
    ],
    '👕 Clothing':[
      `${n(nd+1,8)} sets of underwear`,`${n(nd+1,8)} pairs of socks`,
      `${n(Math.max(nd,3),8)} t-shirts / tops`,
      nd>3?'2 pairs of trousers / jeans':'1 pair of trousers',
      cold?'Heavy winter coat':hot?'Light jacket (evenings)':'Medium jacket',
      cold?'Sweaters / fleece (×2)':null, hot?'Shorts (×2)':null,
      formal?'1 smart / formal outfit':null, beach?'Swimsuit (×2)':null,
      ski?'Ski jacket & trousers':null, ski?'Thermal base layers (×2)':null,
      'Comfortable walking shoes',hike?'Hiking boots (broken in)':null,
      beach?'Flip-flops / sandals':null, cold?'Warm hat, scarf & gloves':null,'Sunglasses',
    ],
    '🧴 Toiletries':[
      'Toothbrush & toothpaste','Shampoo & conditioner','Body wash','Deodorant',
      hot||beach?'☀️ Sunscreen SPF 50+':'Sunscreen',
      beach?'After-sun lotion':null,'Moisturiser & lip balm','Razor / shaving kit',
    ],
    '💊 Health':[
      'Prescription medications (+ 3 days extra)','Pain relievers','Antihistamines',
      'Plasters & blister pads','Hand sanitiser',
      cold?'Cold & flu tablets':null, hike?'Ankle support bandage':null,
      nd>7?'Rehydration sachets':null,
    ],
    '💻 Tech':[
      'Phone + charger','Portable power bank','Universal travel adapter',
      'Earphones / headphones',nd>4?'Laptop or tablet + charger':null,
      'Camera + memory card',beach||hike?'Waterproof phone case':null,
    ],
    '🎒 Extras':[
      rain?'☂️ Compact umbrella':null, beach?'Microfibre beach towel':null,
      'Reusable water bottle',nd>3?'Small day backpack':null,
      'Travel pillow (long flights)','Luggage locks (×2)','Snacks for the journey',
      nd>7?'Laundry bag':null, ski?'Ski goggles & helmet':null,
    ],
  };
}
/* keyword → items lookup for day-specific packing */
const _DAY_PACK={
  beach:['Swimsuit','Sunscreen SPF 50+','Flip-flops / sandals','Beach towel','After-sun lotion','Snorkel gear (if needed)'],
  swim:['Swimsuit','Goggles','Sunscreen SPF 50+','Waterproof phone case'],
  hike:['Hiking boots','Trekking poles','Water bottle (full)','Energy snacks','First-aid kit','Sunscreen'],
  trek:['Hiking boots','Trekking poles','Water bottle (full)','Energy snacks'],
  mountain:['Warm layer / jacket','Hiking boots','Water bottle','Sunscreen'],
  museum:['Comfortable walking shoes','Light jacket (museums are cold)','Notebook / camera'],
  gallery:['Comfortable shoes','Camera','Light jacket'],
  tour:['Comfortable shoes','Water bottle','Camera','Small backpack'],
  dinner:['Smart casual outfit','Card / cash for tipping'],
  restaurant:['Camera for food photos'],
  market:['Cash (small bills)','Reusable bag','Sunscreen'],
  shopping:['Card / cash','Reusable bag'],
  park:['Sunscreen','Water bottle','Comfortable shoes','Snacks'],
  garden:['Comfortable shoes','Camera','Sunscreen'],
  temple:['Modest clothing (shoulders/knees covered)','Socks (for removing shoes)'],
  mosque:['Modest clothing','Headscarf (women)','Socks'],
  church:['Modest clothing','Sunscreen'],
  ruins:['Comfortable walking shoes','Water bottle','Sunscreen','Hat'],
  castle:['Comfortable shoes','Water bottle','Camera'],
  boat:['Sunscreen','Sea-sickness tablets','Light waterproof jacket','Sunglasses'],
  cruise:['Sunscreen','Sea-sickness tablets','Casual & smart outfits'],
  island:['Swimsuit','Sunscreen','Flip-flops','Snorkel gear'],
  safari:['Neutral-coloured clothing','Insect repellent','Binoculars','Sun hat'],
  ski:['Ski jacket','Ski trousers','Thermal base layers','Gloves & hat','Ski goggles'],
  snow:['Warm coat','Thermal layers','Waterproof boots','Gloves'],
  concert:['Ear plugs (optional)','Comfortable clothes','Cash / card'],
  show:['Smart outfit','Camera'],
  cycling:['Helmet','Cycling shorts','Water bottle','Sunscreen'],
  yoga:['Yoga mat (or check if provided)','Comfortable clothes','Water bottle'],
  spa:['Flip-flops','Swimsuit','Hair ties'],
  dive:['Swimsuit','Dive certification card','Underwater camera'],
};

function _getDayPackItems(day){
  const activities=(day.items||[]).map(i=>i.activity+' '+(i.location||'')).join(' ').toLowerCase();
  const matched=new Set();
  Object.entries(_DAY_PACK).forEach(([kw,items])=>{
    if(activities.includes(kw)) items.forEach(i=>matched.add(i));
  });
  // Always include basics
  ['Water bottle','Camera','Phone + charger','Cash / card'].forEach(i=>matched.add(i));
  return [...matched];
}

const _PACK_LS='tw_pack_v1';
function _savePackChecked(){try{localStorage.setItem(_PACK_LS,JSON.stringify(S.packingChecked));}catch(_){}}
function _loadPackChecked(){try{const s=localStorage.getItem(_PACK_LS);if(s)S.packingChecked=JSON.parse(s);}catch(_){}}

function togglePackItem(key){
  S.packingChecked[key]=!S.packingChecked[key];
  _savePackChecked();
  renderPackingModal();
}
function showPackingModal(){
  if(!S.packingTab) S.packingTab='list';
  _loadPackChecked(); // restore checked state from localStorage
  document.getElementById('packingModal').style.display='flex';
  renderPackingModal();
}
function closePackingModal(){document.getElementById('packingModal').style.display='none';}
function setPackTab(t){S.packingTab=t;renderPackingModal();}

function renderPackingModal(){
  const el=document.getElementById('packingContent'); if(!el) return;
  const tab=S.packingTab||'list';
  const hasDays=S.itinerary&&(S.itinerary.days||[]).length>0;
  const tabs=`<div style="display:flex;gap:6px;margin-bottom:14px">
    <button class="trip-btn${tab==='list'?' active':''}" onclick="setPackTab('list')">📋 Full List</button>
    ${hasDays?`<button class="trip-btn${tab==='day'?' active':''}" onclick="setPackTab('day')">📅 By Day</button>`:''}
  </div>`;

  if(tab==='day'&&hasDays){
    const dayHtml=(S.itinerary.days||[]).map((day,di)=>{
      const color=_DAY_COLORS[di%_DAY_COLORS.length];
      const items=_getDayPackItems(day);
      return `<div class="pack-cat">
        <div class="pack-cat-title" style="color:${color}">Day ${day.day}: ${esc(day.title)}</div>
        ${items.map(item=>{
          const key='day'+day.day+':'+item;
          const chk=!!S.packingChecked[key];
          return `<label class="pack-item${chk?' checked':''}">
            <input type="checkbox"${chk?' checked':''} onchange="togglePackItem(${JSON.stringify(key)})">
            <span>${esc(item)}</span>
          </label>`;
        }).join('')}
      </div>`;
    }).join('');
    el.innerHTML=tabs+dayHtml;
    return;
  }

  // Full list view
  const list=_generatePackingList();
  const total=Object.values(list).reduce((s,v)=>s+v.filter(Boolean).length,0);
  const checked=Object.values(S.packingChecked).filter(Boolean).length;
  const pct=total>0?Math.round(checked/total*100):0;
  el.innerHTML=tabs+`
    <div style="font-size:13px;color:var(--fg-dim)">
      ✅ ${checked} / ${total} packed
      <div class="pack-progress"><div class="pack-progress-bar" style="width:${pct}%"></div></div>
    </div>
    ${Object.entries(list).map(([cat,items])=>`
      <div class="pack-cat">
        <div class="pack-cat-title">${cat}</div>
        ${items.filter(Boolean).map(item=>{
          const key=cat+':'+item;
          const chk=!!S.packingChecked[key];
          return `<label class="pack-item${chk?' checked':''}">
            <input type="checkbox"${chk?' checked':''} onchange="togglePackItem(${JSON.stringify(key)})">
            <span>${esc(item)}</span>
          </label>`;
        }).join('')}
      </div>`).join('')}
    <button class="btn small" onclick="S.packingChecked={};_savePackChecked();renderPackingModal()" style="margin-top:4px;font-size:12px">Reset all</button>`;
}
