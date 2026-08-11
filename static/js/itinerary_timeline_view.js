/* ── 7. Itinerary timeline view ──────────────────────────────────── */
function renderItineraryTimeline(){
  return `<div class="timeline">
    ${(S.itinerary?.days||[]).map((day,di)=>{
      const col=_DAY_COLORS[di%_DAY_COLORS.length];
      let seq=0;
      return `<div class="tl-day">
        <div class="tl-day-label" style="color:${col}">Day ${esc(String(day.day))}: ${esc(day.title)}</div>
        ${(day.items||[]).map((item,ii,arr)=>{
          const hasCoords=!!(item.lat&&item.lng);
          if(hasCoords) seq++;
          // Numbered circle for mapped items, plain dot for others — both inline (no absolute)
          const badgeHtml=hasCoords
            ?`<div style="width:22px;height:22px;border-radius:50%;background:${col};border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.4)">${seq<=9?seq:'…'}</div>`
            :`<div style="width:12px;height:12px;border-radius:50%;background:${col};border:2px solid var(--bg);flex-shrink:0;margin:5px 5px 0"></div>`;
          const vlineHtml=ii<arr.length-1
            ?`<div style="flex:1;width:2px;background:var(--border);margin-top:4px;min-height:14px;align-self:stretch"></div>`
            :'';
          return `<div style="display:flex;align-items:stretch;padding-bottom:4px">
            <div style="display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0;margin-right:10px">
              ${badgeHtml}${vlineHtml}
            </div>
            <div style="flex:1;min-width:0;padding-bottom:14px">
              <div class="tl-time" style="color:${col}">${esc(item.time)}</div>
              <div class="tl-activity">${esc(item.activity)}</div>
              ${item.location?`<div class="tl-loc">📍 ${esc(item.location)}</div>`:''}
              ${item.notes?`<div class="tl-note">💡 ${esc(item.notes)}</div>`:''}
              ${item.cost>0?`<div class="tl-cost">${esc(item.cost)} ${esc(S.budget.currency)}</div>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}
  </div>`;}
