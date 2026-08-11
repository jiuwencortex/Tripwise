/* ── Destination Hero Banner (Wikipedia image) ──────────────────────── */
async function fetchDestHeroImage(){
  const dest=S.destinations[S.selectedDest]; if(!dest) return;
  S.destHeroImage=null;
  const query=encodeURIComponent(dest.name);
  try{
    const res=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
    if(!res.ok) return;
    const data=await res.json();
    const img=(data.originalimage&&data.originalimage.source)||
              (data.thumbnail&&data.thumbnail.source);
    if(img){ S.destHeroImage=img; render(); }
  }catch(_){}
}

function renderDestHeroBanner(){
  if(!S.destHeroImage) return '';
  const dest=S.destinations[S.selectedDest];
  return `<div style="position:relative;border-radius:14px;overflow:hidden;margin-bottom:0">
    <img src="${S.destHeroImage}" class="hero-banner" alt="${esc(dest?.name||'')}">
    <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px;background:linear-gradient(transparent,rgba(0,0,0,.7))">
      <div style="font-size:28px;font-weight:800;font-family:var(--heading);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)">${esc(dest?.name||'')} ${esc(dest?.country?'· '+dest.country:'')}</div>
    </div>
  </div>`;
}
