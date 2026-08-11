/* ── phase renderer budget ──────────────────────────────────────────────── */
function renderBudget(){return `<div class="column">
  <h2 class="title">What's your budget?</h2>
  <p class="desc">We'll optimize the plan around your dates and cost range.</p>
  <div class="grid-2" style="grid-template-columns:2fr 1fr">
    <label class="label">Total Budget<input class="input" type="number" data-bind="budget.total" value="${esc(S.budget.total)}" placeholder="5000"/></label>
    <label class="label">Currency<select class="input" data-bind="budget.currency">
      ${["USD ($)","EUR (€)","GBP (£)","ILS (₪)","JPY (¥)","CNY (¥)","INR (₹)","KRW (₩)","SGD (S$)","AED (د.إ)"]
        .map(c=>`<option value="${c}" ${S.budget.currency===c?"selected":""}>${c}</option>`).join("")}
    </select></label>
  </div>
  <div class="grid-2">
    <label class="label">From Date<input class="input" type="date" data-bind="budget.dateFrom" value="${esc(S.budget.dateFrom)}"/></label>
    <label class="label">To Date<input class="input" type="date" data-bind="budget.dateTo" value="${esc(S.budget.dateTo)}"/></label>
  </div>
  <div><div class="label" style="margin-bottom:8px">Date Flexibility</div>
    <div class="pill-row">${["exact","±3 days","±1 week","flexible month"].map(f=>`<button class="pill ${S.budget.flexibility===f?"selected":""}" onclick="S.budget.flexibility='${esc(f)}';render()">${esc(f)}</button>`).join("")}</div>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="setPhase(0)">← Back</button>
    <button class="btn primary" onclick="setPhase(2)" ${(!S.budget.total||!S.budget.dateFrom||!S.budget.dateTo)?"disabled":""}>Continue →</button>
  </div>
</div>`;}
