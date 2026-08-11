/* ── phase renderer preferences ──────────────────────────────────────────────── */
function renderPreferences(){return `<div class="column">
  <h2 class="title">What excites you?</h2>
  <p class="desc">Choose your interests and travel style.</p>
  <div><div class="label" style="margin-bottom:8px">Interests (pick multiple)</div>
    <div class="pill-row">${INTERESTS.map(i=>`<button class="pill ${S.prefs.interests.includes(i)?"selected":""}" onclick="toggleInterest('${esc(i)}')">${esc(i)}</button>`).join("")}</div>
  </div>
  <div><div class="label" style="margin-bottom:8px">Travel Style</div>
    <div class="pill-row">${STYLES.map(s=>`<button class="pill ${S.prefs.style===s?"selected":""}" onclick="S.prefs.style='${esc(s)}';render()">${esc(s)}</button>`).join("")}</div>
  </div>
  <div><div class="label" style="margin-bottom:8px">Top Priority</div>
    <div class="pill-row">${PRIORITIES.map(p=>`<button class="pill ${S.prefs.priority===p?"selected":""}" onclick="S.prefs.priority='${esc(p)}';render()">${esc(p)}</button>`).join("")}</div>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(1)">← Back</button>
    <button class="btn primary" onclick="findDestinations()" ${(S.prefs.interests.length===0||!S.prefs.style)?"disabled":""}>🔍 Discover Destinations</button>
  </div>
  <div class="okbox">Powered by <strong>${esc(SERVER_LABELS[S.serverMode]||S.serverMode)}</strong> via Python FastAPI.</div>
</div>`;}
