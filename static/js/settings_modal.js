/* ── settings modal ───────────────────────────────────────────────── */
const _SETTINGS_LS='tw_settings_v1';

function _loadSettings(){
  try{
    const s=localStorage.getItem(_SETTINGS_LS);
    if(!s) return;
    const d=JSON.parse(s);
    if(d.serverMode)        S.serverMode=d.serverMode;
    if(d.jiuwenclaw_mode)  S.jiuwenclaw_mode=d.jiuwenclaw_mode;
    if(d.numDestinations)   S.numDestinations=d.numDestinations;
    if(d.numFlights)        S.numFlights=d.numFlights;
    if(d.numHotels)         S.numHotels=d.numHotels;
    if(d.numCarRentals)     S.numCarRentals=d.numCarRentals;
    if(d.numAttractions)    S.numAttractions=d.numAttractions;
  }catch(_){}
}

function _saveSettings(){
  try{
    localStorage.setItem(_SETTINGS_LS,JSON.stringify({
      serverMode:        S.serverMode,
      jiuwenclaw_mode:  S.jiuwenclaw_mode,
      numDestinations: S.numDestinations,
      numFlights:      S.numFlights,
      numHotels:       S.numHotels,
      numCarRentals:   S.numCarRentals,
      numAttractions:  S.numAttractions,
    }));
  }catch(_){}
}

function showSettingsModal(){
  document.getElementById('settingsModal').style.display='flex';
  renderSettingsModal();
}

function closeSettingsModal(){
  document.getElementById('settingsModal').style.display='none';
}

function setServerMode(mode){
  S.serverMode=mode;
  _saveSettings();
  renderSettingsModal();
}

function setJiuwenClawMode(mode){
  S.jiuwenclaw_mode=mode;
  _saveSettings();
  renderSettingsModal();
}

function renderSettingsModal(){
  const el=document.getElementById('settingsContent');
  if(!el) return;
  const rows=[
    ['Destinations','numDestinations'],
    ['Flights','numFlights'],
    ['Hotels','numHotels'],
    ['Car Rentals','numCarRentals'],
    ['Attractions','numAttractions'],
  ];
  el.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:20px">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--fg-dim);margin-bottom:10px">Backend Engine</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="server-pill${S.serverMode==='jiuwenclaw'?' active':''}" onclick="setServerMode('jiuwenclaw')">JiuwenClaw</button>
          <button hidden class="server-pill${S.serverMode==='openclaw'?' active':''}" onclick="setServerMode('openclaw')" title="OpenClaw gateway — protocol v3, port 18789">OpenClaw</button>
          <button class="server-pill${S.serverMode==='openjiuwen'?' active':''}" onclick="setServerMode('openjiuwen')">OpenJiuwen</button>
          <button class="server-pill${S.serverMode==='debug'?' active':''}" onclick="setServerMode('debug')" title="Returns instant mock data — no external API calls">🐛 Debug</button>
        </div>
        ${S.serverMode==='debug'?`<div style="font-size:11px;color:#e9c46a;margin-top:8px;line-height:1.5">⚡ Debug mode: returns pre-canned mock data instantly with no external calls. Useful for UI testing.</div>`:''}
      </div>
      ${S.serverMode==='jiuwenclaw'?`
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--fg-dim);margin-bottom:10px">Chat Mode</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="server-pill${S.jiuwenclaw_mode==='agent.plan'?' active':''}" onclick="setJiuwenClawMode('agent.plan')" title="Planning Mode">Planning</button>
          <button class="server-pill${S.jiuwenclaw_mode==='agent.fast'?' active':''}" onclick="setJiuwenClawMode('agent.fast')" title="Performance Mode">Performance</button>
          <button class="server-pill${S.jiuwenclaw_mode==='team'?' active':''}" onclick="setJiuwenClawMode('team')" title="Cluster Mode">Cluster</button>
          <button class="server-pill${S.jiuwenclaw_mode==='code.plan'?' active':''}" onclick="setJiuwenClawMode('code.plan')" title="Code + Planning">Code+Plan</button>
          <button class="server-pill${S.jiuwenclaw_mode==='code.normal'?' active':''}" onclick="setJiuwenClawMode('code.normal')" title="Code + Normal">Code+Normal</button>
        </div>
      </div>`:''}
      <div style="border-top:1px solid var(--border)"></div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--fg-dim);margin-bottom:14px">Results per Planning Step</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${rows.map(([label,key])=>`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
              <span style="font-size:14px;color:var(--fg)">${label}</span>
              <input type="number" min="1" max="10" value="${S[key]||2}"
                style="width:68px;padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg);color:var(--fg);font-size:14px;font-family:var(--body);text-align:center;outline:none"
                onchange="S.${key}=Math.max(1,Math.min(10,parseInt(this.value)||2));_saveSettings()"
                oninput="S.${key}=Math.max(1,Math.min(10,parseInt(this.value)||2));_saveSettings()">
            </div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--fg-dim);margin-top:14px;font-style:italic;line-height:1.6">
          Higher counts give more options but increase AI time and cost.<br>Default: 2 per step.
        </div>
      </div>
    </div>`;
}

// Restore saved settings on page load
_loadSettings();
