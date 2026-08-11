/* ── phase renderer profile ──────────────────────────────────────────────── */
function renderProfile(){return `<div class="column">
  <h2 class="title">Who's traveling?</h2>
  <p class="desc">Tell us about your travel group so we can tailor the trip.</p>
  <div class="grid-2">
    <label class="label">Number of Adults<input class="input" type="number" min="1" data-bind="profile.adults" value="${esc(S.profile.adults)}"/></label>
    <label class="label">Number of Children<input class="input" type="number" min="0" data-bind="profile.children" value="${esc(S.profile.children)}"/></label>
  </div>
  ${S.profile.children>0?`<label class="label">Children's Ages (comma separated)<input class="input" data-bind="profile.childAges" value="${esc(S.profile.childAges)}" placeholder="e.g. 4, 8, 12"/></label>`:""}
  <label class="label">Departing From (City)<input class="input" data-bind="profile.origin" value="${esc(S.profile.origin)}" placeholder="e.g. Paris, New York"/></label>
  <label class="label">Special Needs<input class="input" data-bind="profile.specialNeeds" value="${esc(S.profile.specialNeeds)}" placeholder="e.g. wheelchair access, vegetarian"/></label>
  <div class="btn-row"><button class="btn primary" onclick="setPhase(1)" ${!S.profile.origin?"disabled":""}>Continue →</button></div>
</div>`;}
