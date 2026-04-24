module.exports=[48962,e=>e.a(async(t,r)=>{try{var a=e.i(89171),n=e.i(998879),s=e.i(567266),o=e.i(493458),i=e.i(172724),l=t([s]);[s]=l.then?(await l)():l;let p=["Beginner","Intermediate","Advanced","Expert"],m=["Basic","Conversational","Fluent","Native"];async function c(t,r){if(r){let r=e.r(586843);return(await r(t)).text}return(await n.default.extractRawText({buffer:t})).value}function u(e,t){return(e||[]).map(e=>({id:Math.random().toString(36).substring(2,9),...t(e)}))}async function d(e){try{let t,r=await s.auth.api.getSession({headers:await (0,o.headers)()});if(!r?.user)return a.NextResponse.json({error:"Authentication required"},{status:401});let n=(await e.formData()).get("file");if(!n)return a.NextResponse.json({error:"No file provided"},{status:400});if(n.size>0xa00000)return a.NextResponse.json({error:"File size exceeds 10MB limit"},{status:400});let l=n.name.toLowerCase(),d=l.endsWith(".pdf"),h=l.endsWith(".docx");if(!d&&!h)return a.NextResponse.json({error:"Only PDF and DOCX files are supported"},{status:400});let f=await n.arrayBuffer(),g=Buffer.from(f);try{t=await c(g,d)}catch(e){return console.error("[Resume Parse] File extraction error:",e),a.NextResponse.json({error:"Failed to read file content. The file may be corrupted or password-protected."},{status:422})}if(!t||t.trim().length<20)return a.NextResponse.json({error:"Could not extract meaningful text from the file. It may be image-based or empty."},{status:422});let R=t.slice(0,8e3),v=`You are an expert resume parser. Analyze the following resume text and extract structured information from it.

Return a JSON object with this EXACT structure (no extra keys, no markdown, no explanation):
{
  "contact": {
    "firstName": "",
    "lastName": "",
    "desiredJobTitle": "(their most recent or primary job title)",
    "phone": "",
    "email": ""
  },
  "experiences": [
    {
      "jobTitle": "",
      "employer": "",
      "location": "",
      "startDate": "(format: YYYY-MM or just the year)",
      "endDate": "(format: YYYY-MM, or 'Present' if current)",
      "isCurrentJob": false,
      "description": "(the full description/bullet points for this role, preserve line breaks)"
    }
  ],
  "educations": [
    {
      "schoolName": "",
      "location": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "skills": [
    {
      "name": "",
      "level": "Intermediate"
    }
  ],
  "summary": "(professional summary/objective if present, otherwise generate a brief one from the resume content)",
  "languages": [
    {
      "name": "",
      "proficiency": "Fluent"
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "awards": [
    {
      "title": "",
      "issuer": "",
      "date": ""
    }
  ],
  "websites": [
    {
      "label": "(e.g. LinkedIn, Portfolio, GitHub)",
      "url": ""
    }
  ],
  "references": [
    {
      "name": "",
      "position": "",
      "company": "",
      "email": "",
      "phone": ""
    }
  ],
  "hobbies": [
    {
      "name": ""
    }
  ],
  "customSections": [
    {
      "sectionName": "(the heading/title of the section)",
      "description": "(the content under that section)"
    }
  ]
}

Rules:
- Extract ALL experiences, educations, skills, awards, references, hobbies, and any other sections found
- For skills level use one of: "Beginner", "Intermediate", "Advanced", "Expert"
- For language proficiency use one of: "Basic", "Conversational", "Fluent", "Native"
- Awards/honors section: extract title, issuer/organization, and date
- References section: extract name, position/title, company, email, and phone
- Hobbies/interests section: extract each hobby or interest as a separate item
- Custom sections: any resume section that does NOT fit into the above categories (e.g. "Volunteer Work", "Projects", "Publications", "Organizations") should go into customSections with the section heading as sectionName and the content as description
- If a field is not found, use empty string for strings, empty arrays for arrays
- Preserve original descriptions as closely as possible
- Return ONLY valid JSON. No markdown, no explanation, no code fences.

Resume text:
${R}`;console.log(`[Resume Parse] Extracted ${t.length} chars, sending ${R.length} to AI`);let{content:x,model:y}=await (0,i.callWithFallback)({messages:[{role:"user",content:v}],maxTokens:4e3,temperature:.2});console.log(`[Resume Parse] AI response from ${y} (${x.length} chars)`);let w=(0,i.extractJsonObject)(x);if(!w)return console.error("[Resume Parse] AI returned invalid JSON:",x.slice(0,500)),a.NextResponse.json({error:"Failed to parse resume content. Please try again."},{status:500});let b=w.contact||{},N={contact:{firstName:b.firstName||"",lastName:b.lastName||"",desiredJobTitle:b.desiredJobTitle||"",phone:b.phone||"",email:b.email||""},experiences:u(w.experiences,e=>({jobTitle:e.jobTitle||"",employer:e.employer||"",location:e.location||"",startDate:e.startDate||"",endDate:e.endDate||"",isCurrentJob:e.isCurrentJob||!1,description:e.description||""})),educations:u(w.educations,e=>({schoolName:e.schoolName||"",location:e.location||"",degree:e.degree||"",startDate:e.startDate||"",endDate:e.endDate||"",description:e.description||""})),skills:u(w.skills,e=>({name:e.name||"",level:p.includes(e.level)?e.level:"Intermediate",showLevel:!0})),summary:w.summary||"",finalize:{languages:u(w.languages,e=>({name:e.name||"",proficiency:m.includes(e.proficiency)?e.proficiency:"Fluent"})),certifications:u(w.certifications,e=>({name:e.name||"",issuer:e.issuer||"",date:e.date||""})),awards:u(w.awards,e=>({title:e.title||"",issuer:e.issuer||"",date:e.date||""})),websites:u(w.websites,e=>({label:e.label||"",url:e.url||""})),references:u(w.references,e=>({name:e.name||"",position:e.position||"",company:e.company||"",email:e.email||"",phone:e.phone||""})),hobbies:u(w.hobbies,e=>({name:"string"==typeof e?e:e.name||""})),customSections:u(w.customSections,e=>({sectionName:e.sectionName||"",description:e.description||""}))}};return a.NextResponse.json({data:N})}catch(e){return console.error("[Resume Parse] Error:",e),a.NextResponse.json({error:e.message||"An unexpected error occurred"},{status:500})}}e.s(["POST",0,d]),r()}catch(e){r(e)}},!1),426298,e=>e.a(async(t,r)=>{try{var a=e.i(747909),n=e.i(174017),s=e.i(996250),o=e.i(759756),i=e.i(561916),l=e.i(174677),c=e.i(869741),u=e.i(316795),d=e.i(487718),p=e.i(995169),m=e.i(47587),h=e.i(666012),f=e.i(570101),g=e.i(626937),R=e.i(10372),v=e.i(193695);e.i(820232);var x=e.i(600220),y=e.i(48962),w=t([y]);[y]=w.then?(await w)():w;let N=new a.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/resume/parse/route",pathname:"/api/resume/parse",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/apps/app/app/api/resume/parse/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:E,workUnitAsyncStorage:C,serverHooks:A}=N;async function b(e,t,r){r.requestMeta&&(0,o.setRequestMeta)(e,r.requestMeta),N.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let a="/api/resume/parse/route";a=a.replace(/\/index$/,"")||"/";let s=await N.prepare(e,t,{srcPage:a,multiZoneDraftMode:!1});if(!s)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:y,params:w,nextConfig:b,parsedUrl:E,isDraftMode:C,prerenderManifest:A,routerServerContext:P,isOnDemandRevalidate:T,revalidateOnlyGenerated:S,resolvedPathname:O,clientReferenceManifest:D,serverActionsManifest:k}=s,I=(0,c.normalizeAppPath)(a),j=!!(A.dynamicRoutes[I]||A.routes[O]),_=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,E,!1):t.end("This page could not be found"),null);if(j&&!C){let e=!!A.routes[O],t=A.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if(b.adapterPath)return await _();throw new v.NoFallbackError}}let M=null;!j||N.isDev||C||(M=O,M="/index"===M?"/":M);let F=!0===N.isDev||!j,q=j&&!F;k&&D&&(0,l.setManifestsSingleton)({page:a,clientReferenceManifest:D,serverActionsManifest:k});let H=e.method||"GET",U=(0,i.getTracer)(),$=U.getActiveScopeSpan(),B=!!(null==P?void 0:P.isWrappedByNextServer),L=!!(0,o.getRequestMeta)(e,"minimalMode"),J=(0,o.getRequestMeta)(e,"incrementalCache")||await N.getIncrementalCache(e,b,A,L);null==J||J.resetRequestCache(),globalThis.__incrementalCache=J;let Y={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!b.experimental.authInterrupts},cacheComponents:!!b.cacheComponents,supportsDynamicResponse:F,incrementalCache:J,cacheLifeProfiles:b.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>N.onRequestError(e,t,a,n,P)},sharedContext:{buildId:y}},K=new u.NodeNextRequest(e),z=new u.NodeNextResponse(t),W=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let s,o=async e=>N.handle(W,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=U.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${H} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),s&&s!==e&&(s.setAttribute("http.route",n),s.updateName(t))}else e.updateName(`${H} ${a}`)}),l=async s=>{var i,l;let c=async({previousCacheEntry:n})=>{try{if(!L&&T&&S&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await o(s);e.fetchMetrics=Y.renderOpts.fetchMetrics;let i=Y.renderOpts.pendingWaitUntil;i&&r.waitUntil&&(r.waitUntil(i),i=void 0);let l=Y.renderOpts.collectedTags;if(!j)return await (0,h.sendResponse)(K,z,a,Y.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(a.headers);l&&(t[R.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,n=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:x.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==n?void 0:n.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:a,routeType:"route",revalidateReason:(0,m.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:T})},!1,P),t}},u=await N.handleResponse({req:e,nextConfig:b,cacheKey:M,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:S,responseGenerator:c,waitUntil:r.waitUntil,isMinimalMode:L});if(!j)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==x.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});L||t.setHeader("x-nextjs-cache",T?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,f.fromNodeOutgoingHttpHeaders)(u.value.headers);return L&&j||d.delete(R.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,h.sendResponse)(K,z,new Response(u.value.body,{headers:d,status:u.value.status||200})),null};B&&$?await l($):(s=U.getActiveScopeSpan(),await U.withPropagatedContext(e.headers,()=>U.trace(p.BaseServerSpan.handleRequest,{spanName:`${H} ${a}`,kind:i.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l),void 0,!B))}catch(t){if(t instanceof v.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,m.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:T})},!1,P),j)throw t;return await (0,h.sendResponse)(K,z,new Response(null,{status:500})),null}}e.s(["handler",0,b,"patchFetch",0,function(){return(0,s.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:C})},"routeModule",0,N,"serverHooks",0,A,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,C]),r()}catch(e){r(e)}},!1)];

//# sourceMappingURL=_0pa7i61._.js.map