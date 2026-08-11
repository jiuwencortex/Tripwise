/* ── 2. Budget donut chart ───────────────────────────────────────── */
function renderDonutChart(segs,gt,bgt,currency){
  if(!segs.length) return '';
  const R=54,sz=144,cx=72,cy=72,sw=20,circ=2*Math.PI*R;
  const scale=Math.max(bgt||1,gt||1);
  let arcs='',off=0;
  segs.forEach((seg,i)=>{
    const len=(seg.val/scale)*circ;
    arcs+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${seg.color}"
      stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(circ-len).toFixed(2)}"
      stroke-dashoffset="${(circ*0.25-off).toFixed(2)}"
      style="transition:stroke-dasharray .7s ease ${(i*.12).toFixed(2)}s"/>`;
    off+=len;
  });
  const remLen=Math.max(0,((bgt-gt)/scale)*circ);
  if(remLen>1) arcs+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.05)"
    stroke-width="${sw}" stroke-dasharray="${remLen.toFixed(2)} ${(circ-remLen).toFixed(2)}"
    stroke-dashoffset="${(circ*0.25-off).toFixed(2)}"/>`;
  const pct=bgt>0?Math.round((gt/bgt)*100):0;
  const ok=gt<=bgt;
  const clr=ok?'#79d3b2':'#ff8b7a';
  return `<div class="donut-wrap">
    <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="flex-shrink:0">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--border)" stroke-width="${sw}"/>
      ${arcs}
      <text x="${cx}" y="${cy-5}" text-anchor="middle" fill="${clr}" font-size="17" font-weight="800" font-family="var(--heading)">${pct}%</text>
      <text x="${cx}" y="${cy+11}" text-anchor="middle" fill="var(--fg-dim)" font-size="9.5">of budget</text>
    </svg>
    <div class="donut-legend">
      ${segs.map(s=>`<div class="donut-legend-row">
        <div class="donut-dot" style="background:${s.color}"></div>
        <span class="muted" style="flex:1">${esc(s.label)}</span>
        <span style="font-weight:600">${esc(s.val)} ${esc(currency)}</span>
      </div>`).join('')}
      <div class="donut-legend-row" style="border-top:1px solid var(--border);margin-top:2px;padding-top:6px">
        <div class="donut-dot"></div>
        <span class="muted" style="flex:1">Total</span>
        <strong style="color:${clr}">${esc(gt)} ${esc(currency)}</strong>
      </div>
      <div class="donut-legend-row">
        <div class="donut-dot"></div>
        <span class="muted" style="flex:1">Budget</span>
        <span>${esc(bgt)} ${esc(currency)}</span>
      </div>
      <div style="font-size:12px;margin-top:4px;font-weight:700;color:${clr};text-align:right">
        ${ok?`✅ ${bgt-gt} ${currency} remaining`:`⚠️ ${gt-bgt} ${currency} over budget`}
      </div>
    </div>
  </div>`;
}
