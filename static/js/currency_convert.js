/* ── 4. Currency converter ───────────────────────────────────────── */
const _CCYMAP={'France':'EUR','Germany':'EUR','Italy':'EUR','Spain':'EUR','Portugal':'EUR',
  'Netherlands':'EUR','Greece':'EUR','Austria':'EUR','Belgium':'EUR','Ireland':'EUR','Croatia':'EUR',
  'Japan':'JPY','China':'CNY','South Korea':'KRW','Taiwan':'TWD',
  'United Kingdom':'GBP','UK':'GBP',
  'Australia':'AUD','New Zealand':'NZD','Canada':'CAD','Mexico':'MXN',
  'Brazil':'BRL','Argentina':'ARS','Chile':'CLP','India':'INR',
  'Thailand':'THB','Indonesia':'IDR','Vietnam':'VND','Philippines':'PHP',
  'Malaysia':'MYR','Singapore':'SGD',
  'UAE':'AED','United Arab Emirates':'AED',
  'Morocco':'MAD','Egypt':'EGP','Turkey':'TRY','South Africa':'ZAR',
  'Israel':'ILS','Switzerland':'CHF','Norway':'NOK','Sweden':'SEK',
  'Denmark':'DKK','Poland':'PLN','Czech Republic':'CZK','Hungary':'HUF',
  'United States':'USD','USA':'USD'};
function _budgetCCY(){const m=S.budget.currency.match(/^([A-Z]{3})/);return m?m[1]:'USD';}
async function fetchCurrencyRate(){
  const dest=S.destinations[S.selectedDest]; if(!dest) return;
  const from=_budgetCCY();
  const to=_CCYMAP[dest.country]||_CCYMAP[dest.name];
  if(!to||to===from){S.currencyRate=null;return;}
  try{
    const fromL=from.toLowerCase(), toL=to.toLowerCase();
    const res=await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromL}.json`);
    const data=await res.json();
    const rate=data[fromL]?.[toL]; if(!rate) return;
    S.currencyRate={from,to,rate,budget:Number(S.budget.total||0)};
    render();
  }catch(e){console.warn('Currency fetch failed:',e);}
}
function renderCurrencyCard(){
  if(!S.currencyRate) return '';
  const{from,to,rate,budget}=S.currencyRate;
  const local=Math.round(budget*rate).toLocaleString();
  const rd=rate>=1?rate.toFixed(2):rate.toFixed(4);
  return `<div class="card">
    <div style="font-size:14px;font-weight:700;font-family:var(--heading);margin-bottom:14px">💱 Live Exchange Rate</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <div style="font-size:12px;color:var(--fg-dim);margin-bottom:3px">Rate</div>
        <div class="ccy-rate">1 ${from} = <span style="color:#2cc7ff">${rd} ${to}</span></div>
      </div>
      <div style="border-left:1px solid var(--border);padding-left:16px">
        <div style="font-size:12px;color:var(--fg-dim);margin-bottom:3px">Your budget locally</div>
        <div style="font-size:26px;font-weight:800;font-family:var(--heading);color:var(--accent)">${local} ${to}</div>
        <div style="font-size:11px;color:var(--fg-dim)">${Number(budget).toLocaleString()} ${from}</div>
      </div>
    </div>
  </div>`;
}
