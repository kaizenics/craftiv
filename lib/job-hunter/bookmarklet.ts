import { CLIP_FRAGMENT_KEY } from "./clip";

/**
 * The Craftiv clipper, as a bookmarklet.
 *
 * Ships before any browser extension because it needs no store review, no
 * manifest and no extension id, and it works in every desktop browser. An MV3
 * extension can reuse the same extraction and the same fragment hand-off later.
 *
 * Extraction is deliberately site-agnostic, in falling order of reliability:
 *
 *   1. Whatever the user has selected. If they highlighted the advert, that is
 *      a better signal than any heuristic and it works on every site forever.
 *   2. schema.org JobPosting JSON-LD, which most job boards emit.
 *   3. The largest block of text on the page, which is what a job advert is on
 *      its own page.
 *
 * No CSS class names anywhere, so a redesign cannot silently break it.
 */

/** Readable source. Kept separate from the URL form so it can be reviewed. */
function bookmarkletSource(appUrl: string): string {
  const target = `${appUrl.replace(/\/$/, "")}/dashboard/job-hunter`;

  return `(function(){
  var MAX=5000, MAXF=200;
  function txt(s){return String(s||'').replace(/\\s+/g,' ').trim();}
  function findLd(n){
    if(!n||typeof n!=='object')return null;
    if(Array.isArray(n)){for(var i=0;i<n.length;i++){var f=findLd(n[i]);if(f)return f;}return null;}
    var t=n['@type'];
    if(t==='JobPosting'||(Array.isArray(t)&&t.indexOf('JobPosting')>-1))return n;
    return n['@graph']?findLd(n['@graph']):null;
  }
  var ld=null;
  var nodes=document.querySelectorAll('script[type="application/ld+json"]');
  for(var i=0;i<nodes.length;i++){
    try{var f=findLd(JSON.parse(nodes[i].textContent||'null'));if(f){ld=f;break;}}catch(e){}
  }
  function strip(h){var d=document.createElement('div');d.innerHTML=String(h||'');return txt(d.textContent);}
  function biggest(){
    var best='',els=document.querySelectorAll('article,main,section,div');
    for(var i=0;i<els.length;i++){
      if(els[i].querySelector('article,main,section,div'))continue;
      var t=txt(els[i].innerText||'');
      if(t.length>best.length)best=t;
    }
    return best;
  }
  var sel=txt(window.getSelection?window.getSelection().toString():'');
  var desc=sel||(ld&&ld.description?strip(ld.description):'')||biggest();
  if(!desc||desc.length<40){
    alert('Craftiv could not find the job text on this page. Select the job description first, then click the clipper again.');
    return;
  }
  var org=ld&&ld.hiringOrganization;
  var company=txt(typeof org==='string'?org:(org&&org.name)||'');
  var loc='';
  try{
    var jl=ld&&ld.jobLocation;jl=Array.isArray(jl)?jl[0]:jl;
    var a=jl&&jl.address;
    if(a)loc=txt([a.addressLocality,a.addressRegion,a.addressCountry].filter(Boolean).join(', '));
  }catch(e){}
  var h1=document.querySelector('h1');
  var title=txt((ld&&ld.title)||(h1&&h1.textContent)||document.title.split(/\\s+[|\\u2013-]\\s+/)[0]);
  var payload={url:location.href.slice(0,2048),title:title.slice(0,MAXF),company:company.slice(0,MAXF),location:loc.slice(0,MAXF),description:desc.slice(0,MAX)};
  var b=new TextEncoder().encode(JSON.stringify(payload)),s='';
  for(var j=0;j<b.length;j++)s+=String.fromCharCode(b[j]);
  var enc=btoa(s).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  window.open('${target}#${CLIP_FRAGMENT_KEY}='+enc,'_blank','noopener');
})();`;
}

/**
 * The `javascript:` URL a user drags to their bookmarks bar.
 *
 * Whitespace is collapsed because a bookmarklet URL cannot contain raw
 * newlines, and the whole body is percent-encoded so quotes and slashes
 * survive being pasted into a bookmark.
 */
export function buildBookmarkletUrl(appUrl: string): string {
  const compact = bookmarkletSource(appUrl)
    .split("\n")
    .map((line) => line.trim())
    .join("");

  return `javascript:${encodeURIComponent(compact)}`;
}
