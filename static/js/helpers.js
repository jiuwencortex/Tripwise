/* ── helpers ──────────────────────────────────────────────────────── */
function esc(v) {
  // Convert to string and handle null/undefined/0/false
  const s = (v === null || v === undefined) ? "" : String(v);

  // Use regex for maximum compatibility unless you are 100% sure
  // your users are on modern browsers
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function scoreCircle(val,lbl){
  const deg=Math.max(0,Math.min(100,Number(val||0)))*3.6;
  return `<div class="score">
    <div class="score-circle" style="background:conic-gradient(var(--accent) ${deg}deg,var(--border) 0deg)">
      <div class="score-inner">${esc(val)}</div></div>
    <div style="font-size:10px" class="muted">${esc(lbl)}</div></div>`;
}
function days(from,to){
  return Math.max(1,Math.ceil((new Date(to)-new Date(from))/86400000));
}
function parseJSON(raw) {
  if (Array.isArray(raw) || (raw && typeof raw === "object")) return raw;

  // 1. Clean up the string: Remove potential wrapping quotes if passed as a string literal
  let t = typeof raw === "string" ? raw : JSON.stringify(raw || "");

  try {
    // 2. The Regex: Optimized to find the first '{' or '[' and the last '}' or ']'
    // The [\s\S] ensures it matches across newlines
    const m = t.match(/```json\s*([\s\S]*?)```/) ||
              t.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

    if (m) {
      // Use the captured group, trim whitespace
      let jsonString = m[1].trim();

      // 3. REPAIR LOGIC (for the truncated "paella" cases)
      const openBraces = (jsonString.match(/\{/g) || []).length;
      const closedBraces = (jsonString.match(/\}/g) || []).length;
      const openBrackets = (jsonString.match(/\[/g) || []).length;
      const closedBrackets = (jsonString.match(/\]/g) || []).length;

      if (openBraces > closedBraces) {
        // Fix the specific LLM cutoff where it adds extra brackets
        if (jsonString.endsWith(']]')) jsonString = jsonString.slice(0, -1);
        jsonString += "}".repeat(openBraces - closedBraces);
      }

      const currentClosedBrackets = (jsonString.match(/\]/g) || []).length;
      if (openBrackets > currentClosedBrackets) {
        jsonString += "]".repeat(openBrackets - currentClosedBrackets);
      }

      // 4. Parse the result
      return JSON.parse(jsonString);
    }
  } catch (e) {
    console.error("Parse Error Details:", e);
    // If it fails, it might be due to double-escaped newlines in the string
    try {
        return JSON.parse(t.replace(/\\n/g, " "));
    } catch(secondError) {
        throw new Error("Final parse failed: " + e.message);
    }
  }
  return null;
}
function buildContextText(){
  const d=S.selectedDest!=null?S.destinations[S.selectedDest]:null;
  return [
    `Traveler Profile: ${S.profile.adults} adults, ${S.profile.children} children (ages: ${S.profile.childAges||"N/A"}). Special needs: ${S.profile.specialNeeds||"none"}. Departing from: ${S.profile.origin}.`,
    `Budget: ${S.budget.total} ${S.budget.currency} total. Dates: ${S.budget.dateFrom} to ${S.budget.dateTo}. Flexibility: ${S.budget.flexibility}.`,
    `Preferences: Interests: ${S.prefs.interests.join(", ")}. Style: ${S.prefs.style}. Priority: ${S.prefs.priority}.`,
    d?`Selected Destination: ${d.name}, ${d.country}.`:"",
    S.selectedFlight!=null?`Selected Flight: ${JSON.stringify(S.flights[S.selectedFlight])}`:"",
    S.selectedHotel!=null?`Selected Hotel: ${JSON.stringify(S.hotels[S.selectedHotel])}`:"",
    S.selectedCar!=null&&S.selectedCar>=0?`Selected Car: ${JSON.stringify(S.carRentals[S.selectedCar])}`:"",
  ].filter(Boolean).join("\n");
}