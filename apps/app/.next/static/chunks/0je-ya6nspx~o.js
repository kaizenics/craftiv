(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,850485,e=>{"use strict";var t=e.i(843476),a=e.i(964053),n=e.i(718938),r=e.i(78549);e.i(197379);var i=e.i(472804),o=e.i(568275);function s({...e}){return(0,t.jsx)(a.Dialog.Portal,{"data-slot":"sheet-portal",...e})}function l({className:e,...r}){return(0,t.jsx)(a.Dialog.Overlay,{"data-slot":"sheet-overlay",className:(0,n.cn)("fixed inset-0 z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",e),...r})}e.s(["Sheet",0,function({...e}){return(0,t.jsx)(a.Dialog.Root,{"data-slot":"sheet",...e})},"SheetContent",0,function({className:e,children:d,side:c="right",showCloseButton:u=!0,...m}){return(0,t.jsxs)(s,{children:[(0,t.jsx)(l,{}),(0,t.jsxs)(a.Dialog.Content,{"data-slot":"sheet-content","data-side":c,className:(0,n.cn)("fixed z-50 flex flex-col bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10",e),...m,children:[d,u&&(0,t.jsx)(a.Dialog.Close,{"data-slot":"sheet-close",asChild:!0,children:(0,t.jsxs)(r.Button,{variant:"ghost",className:"absolute top-4 right-4",size:"icon-sm",children:[(0,t.jsx)(i.HugeiconsIcon,{icon:o.Cancel01Icon,strokeWidth:2}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})})]})]})},"SheetDescription",0,function({className:e,...r}){return(0,t.jsx)(a.Dialog.Description,{"data-slot":"sheet-description",className:(0,n.cn)("text-sm text-muted-foreground",e),...r})},"SheetHeader",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"sheet-header",className:(0,n.cn)("flex flex-col gap-1.5 p-6",e),...a})},"SheetTitle",0,function({className:e,...r}){return(0,t.jsx)(a.Dialog.Title,{"data-slot":"sheet-title",className:(0,n.cn)("font-heading text-base font-medium text-foreground",e),...r})},"SheetTrigger",0,function({...e}){return(0,t.jsx)(a.Dialog.Trigger,{"data-slot":"sheet-trigger",...e})}])},999682,e=>{"use strict";var t=e.i(271645);e.s(["usePrevious",0,function(e){let a=t.useRef({value:e,previous:e});return t.useMemo(()=>(a.current.value!==e&&(a.current.previous=a.current.value,a.current.value=e),a.current.previous),[e])}])},511830,e=>{"use strict";var t=e.i(843476),a=e.i(271645),n=e.i(981140),r=e.i(820783),i=e.i(30030),o=e.i(369340),s=e.i(999682),l=e.i(635804),d=e.i(248425),c="Switch",[u,m]=(0,i.createContextScope)(c),[h,f]=u(c),p=a.forwardRef((e,i)=>{let{__scopeSwitch:s,name:l,checked:u,defaultChecked:m,required:f,disabled:p,value:g="on",onCheckedChange:b,form:y,...v}=e,[S,j]=a.useState(null),k=(0,r.useComposedRefs)(i,e=>j(e)),$=a.useRef(!1),N=!S||y||!!S.closest("form"),[D,P]=(0,o.useControllableState)({prop:u,defaultProp:m??!1,onChange:b,caller:c});return(0,t.jsxs)(h,{scope:s,checked:D,disabled:p,children:[(0,t.jsx)(d.Primitive.button,{type:"button",role:"switch","aria-checked":D,"aria-required":f,"data-state":x(D),"data-disabled":p?"":void 0,disabled:p,value:g,...v,ref:k,onClick:(0,n.composeEventHandlers)(e.onClick,e=>{P(e=>!e),N&&($.current=e.isPropagationStopped(),$.current||e.stopPropagation())})}),N&&(0,t.jsx)(w,{control:S,bubbles:!$.current,name:l,value:g,checked:D,required:f,disabled:p,form:y,style:{transform:"translateX(-100%)"}})]})});p.displayName=c;var g="SwitchThumb",b=a.forwardRef((e,a)=>{let{__scopeSwitch:n,...r}=e,i=f(g,n);return(0,t.jsx)(d.Primitive.span,{"data-state":x(i.checked),"data-disabled":i.disabled?"":void 0,...r,ref:a})});b.displayName=g;var w=a.forwardRef(({__scopeSwitch:e,control:n,checked:i,bubbles:o=!0,...d},c)=>{let u=a.useRef(null),m=(0,r.useComposedRefs)(u,c),h=(0,s.usePrevious)(i),f=(0,l.useSize)(n);return a.useEffect(()=>{let e=u.current;if(!e)return;let t=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"checked").set;if(h!==i&&t){let a=new Event("click",{bubbles:o});t.call(e,i),e.dispatchEvent(a)}},[h,i,o]),(0,t.jsx)("input",{type:"checkbox","aria-hidden":!0,defaultChecked:i,...d,tabIndex:-1,ref:m,style:{...d.style,...f,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})});function x(e){return e?"checked":"unchecked"}w.displayName="SwitchBubbleInput",e.s(["Root",0,p,"Switch",0,p,"SwitchThumb",0,b,"Thumb",0,b,"createSwitchScope",0,m],57287);var y=e.i(57287),y=y,v=e.i(718938);e.s(["Switch",0,function({className:e,size:a="default",...n}){return(0,t.jsx)(y.Root,{"data-slot":"switch","data-size":a,className:(0,v.cn)("peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",e),...n,children:(0,t.jsx)(y.Thumb,{"data-slot":"switch-thumb",className:"pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"})})}],511830)},479431,e=>{"use strict";var t=e.i(843476),a=e.i(271645),n=e.i(618566),r=e.i(78549),i=e.i(674094),o=e.i(734426),s=e.i(199863),l=e.i(375460),d=e.i(994566),c=e.i(511841);async function u({data:e,template:t,fileName:a,designOptions:n,customColor:r}){let i=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(i||(i=document.querySelector("[data-resume-preview]")),!i)throw Error("Resume preview element not found. Please ensure the resume is rendered on the page.");let o=i.cloneNode(!0);!function(e,t){let a=[e,...Array.from(e.querySelectorAll("*"))],n=[t,...Array.from(t.querySelectorAll("*"))],r=Math.min(a.length,n.length);for(let e=0;e<r;e++){let t=a[e],r=n[e];if(!(r instanceof HTMLElement))continue;let i=window.getComputedStyle(t),o=Array.from(i).map(e=>`${e}:${i.getPropertyValue(e)};`).join("");r.style.cssText=o}}(i,o),o.querySelectorAll("img").forEach(e=>{let t=e.getAttribute("src");if(t)try{let a=new URL(t,window.location.origin).toString();e.setAttribute("src",a)}catch{}});let s=window.getComputedStyle(i).backgroundColor||"#ffffff";o.querySelectorAll("button, input, select, textarea, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]").forEach(e=>{e.remove()});let l=Array.from(document.querySelectorAll('head link[rel="preconnect"], head link[rel="stylesheet"]')).filter(e=>{let t=e.getAttribute("href")||"";return t.includes("fonts.googleapis.com")||t.includes("fonts.gstatic.com")}).map(e=>e.outerHTML).join("\n"),d=`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${window.location.origin}/" />
    ${l}
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: ${s};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      [data-resume-preview] {
        width: 210mm !important;
        max-width: 210mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: ${s} !important;
      }
    </style>
  </head>
  <body>
    ${o.outerHTML}
  </body>
</html>
  `.trim(),c=await fetch("/api/resume/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:d,fileName:a})});if(!c.ok){let e=await c.text();throw Error(`Failed to generate PDF: ${e}`)}let m=await c.blob(),h=URL.createObjectURL(m),f=document.createElement("a");f.href=h,f.download=`${a}.pdf`,document.body.appendChild(f),f.click(),f.remove(),URL.revokeObjectURL(h)}let m={fontFamily:"Inter, sans-serif",fontSize:11,lineSpacing:1.6,sectionSpacing:20,paragraphSpacing:12};function h(e,t){return`
    <div class="section">
      <div class="section-title">Education</div>
      ${e.map(e=>t?`
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${e.schoolName}</span>
                <span class="entry-date">${e.startDate} - ${e.endDate}</span>
              </div>
              <div class="entry-position">${e.degree}</div>
              ${e.location?`<div class="entry-subtitle">${e.location}</div>`:""}
              ${e.description?`<div class="entry-description">${e.description}</div>`:""}
            </div>
          `:`
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${e.degree}</span>
                <span class="entry-date">${e.startDate} - ${e.endDate}</span>
              </div>
              <div class="entry-subtitle">${e.schoolName}${e.location?`, ${e.location}`:""}</div>
              ${e.description?`<div class="entry-description">${e.description}</div>`:""}
            </div>
          `).join("")}
    </div>
  `}let f=["display","position","top","right","bottom","left","float","clear","width","height","max-width","max-height","min-width","min-height","margin","margin-top","margin-right","margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom","padding-left","border","border-top","border-right","border-bottom","border-left","border-radius","box-sizing","background","background-color","color","font","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-transform","text-decoration","white-space","word-break","overflow","overflow-x","overflow-y","flex","flex-direction","flex-wrap","justify-content","align-items","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","opacity"];async function p({data:e,template:t,fileName:a,designOptions:n,customColor:r}){let i,o=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(o){var s;let e,t,a=o.cloneNode(!0);a.style.width="210mm",a.style.maxWidth="210mm",a.style.minHeight="auto",a.style.margin="0 auto",a.style.backgroundColor="#ffffff",a.style.borderRadius="0",a.style.boxShadow="none",a.style.overflow="visible",a.style.height="auto";let n=a.querySelector("[data-resume-content]");n&&(n.style.overflow="visible",n.style.height="auto",n.style.maxHeight="none"),e=[o,...Array.from(o.querySelectorAll("*"))],t=[a,...Array.from(a.querySelectorAll("*"))],e.forEach((e,a)=>{let n=t[a];if(!(e instanceof HTMLElement)||!n)return;let r=window.getComputedStyle(e),i=f.map(e=>`${e}:${r.getPropertyValue(e)};`).join("");n.setAttribute("style",i)}),a.querySelectorAll("[data-preview-header], [data-preview-footer], [data-page-break-indicator], button, input, select").forEach(e=>{e.remove()}),s=a.outerHTML,i=`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word 15">
      <meta name="Originator" content="Microsoft Word 15">
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; background: #ffffff; }
      </style>
    </head>
    <body>${s}</body>
    </html>
  `}else i=function({data:e,template:t,designOptions:a}){var n,r,i,o,s,l,d,c,u,m,f,p;let g=t.layout||"classic",b="harvard"===g,w=`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: ${a.fontFamily}; 
        font-size: ${a.fontSize}pt; 
        line-height: ${a.lineSpacing};
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .title { font-size: 12pt; color: #666; margin-top: 5px; }
      .contact-info { font-size: 10pt; color: #666; margin-top: 10px; }
      .section { margin-bottom: ${a.sectionSpacing}px; page-break-inside: avoid; }
      .entry { margin-bottom: ${a.paragraphSpacing}px; page-break-inside: avoid; }
      .entry-header { display: flex; justify-content: space-between; }
      .entry-title { font-weight: bold; }
      .entry-date { color: #666; font-size: 10pt; }
      .entry-subtitle { color: #666; font-size: 10pt; }
      .entry-description { margin-top: 5px; font-size: 10pt; white-space: pre-line; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { background: #f0f0f0; padding: 3px 10px; border-radius: 3px; font-size: 10pt; }
      .summary { font-size: 10pt; color: #444; }
      .page-break { page-break-before: always; }
      @media print {
        body { padding: 20px; }
        @page { 
          margin: 0.5in; 
          size: letter;
        }
        @page { margin-top: 0.5in; margin-bottom: 0.5in; }
        html, body { height: 100%; width: 100%; }
      }
      @page { 
        margin-header: 0mm;
        margin-footer: 0mm;
      }
    </style>
  <style>${function(e,t,a){switch(e){case"harvard":return`
        .header { text-align: center; margin-bottom: ${a.sectionSpacing}px; border-bottom: 1px solid #1e1e1e; padding-bottom: 15px; }
        .name { font-size: 22pt; font-weight: bold; color: #1e1e1e; text-transform: uppercase; letter-spacing: 1px; }
        .section-title { 
          font-size: 11pt; 
          font-weight: bold; 
          color: #1e1e1e; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          border-bottom: 1px solid #1e1e1e; 
          padding-bottom: 3px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
        .entry-title { font-weight: bold; color: #1e1e1e; }
        .entry-position { font-style: italic; }
      `;case"modern":return`
        .header { text-align: left; margin-bottom: ${a.sectionSpacing}px; border-bottom: 3px solid ${t}; padding-bottom: 15px; }
        .name { font-size: 26pt; font-weight: bold; color: ${t}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
      `;case"bold":return`
        .header { background: ${t}; color: white; padding: 30px; margin: -40px -40px 20px -40px; }
        .name { font-size: 28pt; font-weight: bold; color: white; text-transform: uppercase; }
        .title { color: rgba(255,255,255,0.8); }
        .contact-info { color: rgba(255,255,255,0.7); }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: white; 
          text-transform: uppercase; 
          background: ${t};
          padding: 5px 10px;
          margin-bottom: ${a.paragraphSpacing}px; 
        }
        .entry { border-left: 4px solid ${t}; padding-left: 15px; }
      `;case"minimal":return`
        .header { text-align: center; margin-bottom: ${a.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: 600; color: #333; }
        .title { color: #666; }
        .contact-info { color: #999; }
        .section-title { 
          font-size: 11pt; 
          font-weight: 600; 
          color: #333; 
          text-transform: uppercase; 
          border-bottom: 1px solid #ddd; 
          padding-bottom: 5px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
      `;case"executive":return`
        .header { margin-bottom: ${a.sectionSpacing}px; border-bottom: 2px solid ${t}; padding-bottom: 15px; }
        .name { font-size: 28pt; font-weight: bold; color: ${t}; }
        .summary { border-left: 4px solid ${t}; padding-left: 15px; font-style: italic; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
      `;case"sidebar":return`
        .header { text-align: center; margin-bottom: ${a.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: bold; color: ${t}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
      `;default:return`
        .header { text-align: center; margin-bottom: ${a.sectionSpacing}px; border-top: 4px solid ${t}; padding-top: 20px; }
        .name { font-size: 24pt; font-weight: bold; color: ${t}; text-transform: uppercase; letter-spacing: 2px; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${a.paragraphSpacing}px; 
        }
      `}}(g,t.primaryColor,a)}</style>`;return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${e.contact.firstName} ${e.contact.lastName} - Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      ${w}
    </head>
    <body>
      ${n=e,`
    <div class="header">
      <div class="name">${n.contact.firstName||"Your"} ${n.contact.lastName||"Name"}</div>
      ${n.contact.desiredJobTitle?`<div class="title">${n.contact.desiredJobTitle}</div>`:""}
      <div class="contact-info">
        ${[n.contact.email,n.contact.phone].filter(Boolean).join(" | ")}
      </div>
    </div>
  `}
      ${!b&&e.summary?(r=e.summary,`
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${r}</div>
    </div>
  `):""}
      ${b&&e.educations.length>0?h(e.educations,b):""}
      ${e.experiences.length>0?(i=e.experiences,o=b,`
    <div class="section">
      <div class="section-title">Experience</div>
      ${i.map(e=>`
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${o?e.employer:e.jobTitle}${!o&&e.employer?`, ${e.employer}`:""}</span>
            <span class="entry-date">${e.startDate} - ${e.isCurrentJob?"Present":e.endDate}</span>
          </div>
          ${o?`<div class="entry-position">${e.jobTitle}</div>`:""}
          ${e.location?`<div class="entry-subtitle">${e.location}</div>`:""}
          ${e.description?`<div class="entry-description">${e.description}</div>`:""}
        </div>
      `).join("")}
    </div>
  `):""}
      ${!b&&e.educations.length>0?h(e.educations,b):""}
      ${e.skills.length>0?(s=e.skills,l=b,`
    <div class="section">
      <div class="section-title">${l?"Skills & Interests":"Skills"}</div>
      ${l?`
        <div>${s.map(e=>e.name).join(", ")}</div>
      `:`
        <div class="skills-list">
          ${s.map(e=>`
            <span class="skill-tag">${e.name}${e.showLevel?` (${e.level})`:""}</span>
          `).join("")}
        </div>
      `}
    </div>
  `):""}
      ${e.finalize.languages.length>0?(d=e.finalize.languages,`
    <div class="section">
      <div class="section-title">Languages</div>
      <div>${d.map(e=>`${e.name} (${e.proficiency})`).join(", ")}</div>
    </div>
  `):""}
      ${e.finalize.certifications.length>0?(c=e.finalize.certifications,`
    <div class="section">
      <div class="section-title">Certifications</div>
      ${c.map(e=>`<div>${e.name} - ${e.issuer} (${e.date})</div>`).join("")}
    </div>
  `):""}
      ${e.finalize.awards.length>0?(u=e.finalize.awards,`
    <div class="section">
      <div class="section-title">Awards & Honors</div>
      ${u.map(e=>`<div>${e.title} - ${e.issuer} (${e.date})</div>`).join("")}
    </div>
  `):""}
      ${e.finalize.websites.length>0?(m=e.finalize.websites,`
    <div class="section">
      <div class="section-title">Links</div>
      <div>${m.map(e=>`${e.label}: ${e.url}`).join(" | ")}</div>
    </div>
  `):""}
      ${e.finalize.references.length>0?(f=e.finalize.references,`
    <div class="section">
      <div class="section-title">References</div>
      ${f.map(e=>`
        <div class="entry">
          <div class="entry-title">${e.name}</div>
          <div class="entry-subtitle">${e.position}${e.company?`, ${e.company}`:""}</div>
          <div style="font-size: 10pt; color: #666;">${e.email}${e.phone?` | ${e.phone}`:""}</div>
        </div>
      `).join("")}
    </div>
  `):""}
      ${e.finalize.hobbies.length>0?(p=e.finalize.hobbies,`
    <div class="section">
      <div class="section-title">Hobbies & Interests</div>
      <div>${p.map(e=>e.name).join(", ")}</div>
    </div>
  `):""}
      ${e.finalize.customSections.map(e=>{var t;return t=e,`
    <div class="section">
      <div class="section-title">${t.sectionName}</div>
      <div>${t.description}</div>
    </div>
  `}).join("")}
    </body>
    </html>
  `}({data:e,template:{primaryColor:r||t.primaryColor,layout:t.layout||"classic"},designOptions:n});let l=new Blob([i],{type:"application/msword"}),d=URL.createObjectURL(l),c=document.createElement("a");c.href=d,c.download=`${a}.doc`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(d)}e.s(["DownloadDialog",0,function({data:e,isOpen:h,onClose:f,designOptions:g=m,customFileName:b,customColor:w,showPhoto:x=!1,onDownloadComplete:y}){let v=(0,n.useRouter)(),[S,j]=(0,a.useState)("pdf"),[k,$]=(0,a.useState)(!1),[N,D]=(0,a.useState)(!1),P=l.resumeTemplates.find(t=>t.id===e.templateId)||l.resumeTemplates[0],M=b||`${e.contact.firstName||"Resume"}_${e.contact.lastName||"CV"}`,C=async()=>{if(N)return void v.push("/dashboard");$(!0);try{"pdf"===S?(await new Promise(e=>setTimeout(e,100)),await u({data:e,template:P,fileName:M,designOptions:g,customColor:w})):await p({data:e,template:P,fileName:M,designOptions:g,customColor:w}),D(!0),y&&y()}catch(e){console.error("Download failed:",e),alert("Failed to generate resume. Please try again.")}finally{$(!1)}};return((0,a.useEffect)(()=>{h&&setTimeout(()=>{let e=document.querySelector("[data-resume-export-preview] [data-resume-preview]");e&&e.getBoundingClientRect()},50)},[h]),h)?(0,t.jsxs)(t.Fragment,{children:[h&&(0,t.jsx)("div",{"data-resume-export-preview":!0,style:{position:"fixed",left:"-10000px",top:0,width:"210mm",height:"auto",overflow:"visible",visibility:"visible"},children:(0,t.jsx)(d.ResumePreview,{data:e,designOptions:g,customColor:w,showPhoto:x,showScore:!1,showFooter:!1,plain:!0,renderAllPages:!0})}),(0,t.jsx)(s.Dialog,{open:h,onOpenChange:f,children:(0,t.jsxs)(s.DialogContent,{className:"sm:max-w-md",children:[(0,t.jsxs)(s.DialogHeader,{children:[(0,t.jsx)("div",{className:"flex justify-center mb-4",children:(0,t.jsx)("div",{className:"inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10",children:(0,t.jsx)(c.Download,{className:"h-6 w-6 text-primary"})})}),(0,t.jsx)(s.DialogTitle,{className:"text-center",children:"Download Your Resume"}),(0,t.jsx)(s.DialogDescription,{className:"text-center",children:"Choose your preferred format"})]}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsx)(i.Label,{className:"text-sm font-medium",children:"Select Format"}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,t.jsxs)("button",{onClick:()=>j("pdf"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"pdf"===S?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.FileText,{className:`h-8 w-8 ${"pdf"===S?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"PDF"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Best for sharing"})]}),(0,t.jsxs)("button",{onClick:()=>j("docx"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"docx"===S?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.File,{className:`h-8 w-8 ${"docx"===S?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"DOCX"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Easy to edit"})]})]}),(0,t.jsxs)("div",{className:"bg-muted/50 rounded-lg p-3 text-sm",children:[(0,t.jsxs)("p",{className:"font-medium mb-1",children:["File: ",M,".",S]}),(0,t.jsxs)("p",{className:"text-muted-foreground text-xs",children:["Template: ",P.name]})]}),(0,t.jsxs)("div",{className:"flex gap-3 pt-2",children:[(0,t.jsx)(r.Button,{variant:"outline",onClick:f,className:"flex-1",children:"Cancel"}),(0,t.jsx)(r.Button,{onClick:C,disabled:k,className:"flex-1",children:k?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.Spinner,{className:"mr-2 h-4 w-4"}),"Downloading..."]}):N?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.ArrowRight,{className:"mr-2 h-4 w-4"}),"Go To Dashboard"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.Download,{className:"mr-2 h-4 w-4"}),"Download ",S.toUpperCase()]})})]})]})]})})]}):null}],479431)},381515,234662,677241,281092,845110,585890,e=>{"use strict";let t=Symbol.for("constructDateFrom");function a(e,a){return"function"==typeof e?e(a):e&&"object"==typeof e&&t in e?e[t](a):e instanceof Date?new e.constructor(a):new Date(a)}function n(e,t){return a(t||e,e)}function r(e){let t=n(e),a=new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate(),t.getHours(),t.getMinutes(),t.getSeconds(),t.getMilliseconds()));return a.setUTCFullYear(t.getFullYear()),e-a}function i(e,...t){let n=a.bind(null,e||t.find(e=>"object"==typeof e));return t.map(n)}function o(e,t){let a=n(e,t?.in);return a.setHours(0,0,0,0),a}e.s(["constructFromSymbol",0,t,"millisecondsInDay",0,864e5,"millisecondsInWeek",0,6048e5],234662),e.s(["constructFrom",0,a],677241),e.s(["toDate",0,n],281092),e.s(["normalizeDates",0,i],845110),e.s(["startOfDay",0,o],585890),e.s(["differenceInCalendarDays",0,function(e,t,a){let[n,s]=i(a?.in,e,t),l=o(n),d=o(s);return Math.round((l-r(l)-(d-r(d)))/864e5)}],381515)},455024,e=>{"use strict";let t={};e.s(["getDefaultOptions",0,function(){return t}])},55545,328607,e=>{"use strict";var t;let a={lessThanXSeconds:{one:"less than a second",other:"less than {{count}} seconds"},xSeconds:{one:"1 second",other:"{{count}} seconds"},halfAMinute:"half a minute",lessThanXMinutes:{one:"less than a minute",other:"less than {{count}} minutes"},xMinutes:{one:"1 minute",other:"{{count}} minutes"},aboutXHours:{one:"about 1 hour",other:"about {{count}} hours"},xHours:{one:"1 hour",other:"{{count}} hours"},xDays:{one:"1 day",other:"{{count}} days"},aboutXWeeks:{one:"about 1 week",other:"about {{count}} weeks"},xWeeks:{one:"1 week",other:"{{count}} weeks"},aboutXMonths:{one:"about 1 month",other:"about {{count}} months"},xMonths:{one:"1 month",other:"{{count}} months"},aboutXYears:{one:"about 1 year",other:"about {{count}} years"},xYears:{one:"1 year",other:"{{count}} years"},overXYears:{one:"over 1 year",other:"over {{count}} years"},almostXYears:{one:"almost 1 year",other:"almost {{count}} years"}};function n(e){return (t={})=>{let a=t.width?String(t.width):e.defaultWidth;return e.formats[a]||e.formats[e.defaultWidth]}}let r={date:n({formats:{full:"EEEE, MMMM do, y",long:"MMMM do, y",medium:"MMM d, y",short:"MM/dd/yyyy"},defaultWidth:"full"}),time:n({formats:{full:"h:mm:ss a zzzz",long:"h:mm:ss a z",medium:"h:mm:ss a",short:"h:mm a"},defaultWidth:"full"}),dateTime:n({formats:{full:"{{date}} 'at' {{time}}",long:"{{date}} 'at' {{time}}",medium:"{{date}}, {{time}}",short:"{{date}}, {{time}}"},defaultWidth:"full"})},i={lastWeek:"'last' eeee 'at' p",yesterday:"'yesterday at' p",today:"'today at' p",tomorrow:"'tomorrow at' p",nextWeek:"eeee 'at' p",other:"P"};function o(e){return(t,a)=>{let n;if("formatting"===(a?.context?String(a.context):"standalone")&&e.formattingValues){let t=e.defaultFormattingWidth||e.defaultWidth,r=a?.width?String(a.width):t;n=e.formattingValues[r]||e.formattingValues[t]}else{let t=e.defaultWidth,r=a?.width?String(a.width):e.defaultWidth;n=e.values[r]||e.values[t]}return n[e.argumentCallback?e.argumentCallback(t):t]}}function s(e){return(t,a={})=>{let n,r=a.width,i=r&&e.matchPatterns[r]||e.matchPatterns[e.defaultMatchWidth],o=t.match(i);if(!o)return null;let s=o[0],l=r&&e.parsePatterns[r]||e.parsePatterns[e.defaultParseWidth],d=Array.isArray(l)?function(e,t){for(let a=0;a<e.length;a++)if(t(e[a]))return a}(l,e=>e.test(s)):function(e,t){for(let a in e)if(Object.prototype.hasOwnProperty.call(e,a)&&t(e[a]))return a}(l,e=>e.test(s));return n=e.valueCallback?e.valueCallback(d):d,{value:n=a.valueCallback?a.valueCallback(n):n,rest:t.slice(s.length)}}}let l={code:"en-US",formatDistance:(e,t,n)=>{let r,i=a[e];if(r="string"==typeof i?i:1===t?i.one:i.other.replace("{{count}}",t.toString()),n?.addSuffix)if(n.comparison&&n.comparison>0)return"in "+r;else return r+" ago";return r},formatLong:r,formatRelative:(e,t,a,n)=>i[e],localize:{ordinalNumber:(e,t)=>{let a=Number(e),n=a%100;if(n>20||n<10)switch(n%10){case 1:return a+"st";case 2:return a+"nd";case 3:return a+"rd"}return a+"th"},era:o({values:{narrow:["B","A"],abbreviated:["BC","AD"],wide:["Before Christ","Anno Domini"]},defaultWidth:"wide"}),quarter:o({values:{narrow:["1","2","3","4"],abbreviated:["Q1","Q2","Q3","Q4"],wide:["1st quarter","2nd quarter","3rd quarter","4th quarter"]},defaultWidth:"wide",argumentCallback:e=>e-1}),month:o({values:{narrow:["J","F","M","A","M","J","J","A","S","O","N","D"],abbreviated:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],wide:["January","February","March","April","May","June","July","August","September","October","November","December"]},defaultWidth:"wide"}),day:o({values:{narrow:["S","M","T","W","T","F","S"],short:["Su","Mo","Tu","We","Th","Fr","Sa"],abbreviated:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],wide:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},defaultWidth:"wide"}),dayPeriod:o({values:{narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"}},defaultWidth:"wide",formattingValues:{narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"}},defaultFormattingWidth:"wide"})},match:{ordinalNumber:(t={matchPattern:/^(\d+)(th|st|nd|rd)?/i,parsePattern:/\d+/i,valueCallback:e=>parseInt(e,10)},(e,a={})=>{let n=e.match(t.matchPattern);if(!n)return null;let r=n[0],i=e.match(t.parsePattern);if(!i)return null;let o=t.valueCallback?t.valueCallback(i[0]):i[0];return{value:o=a.valueCallback?a.valueCallback(o):o,rest:e.slice(r.length)}}),era:s({matchPatterns:{narrow:/^(b|a)/i,abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,wide:/^(before christ|before common era|anno domini|common era)/i},defaultMatchWidth:"wide",parsePatterns:{any:[/^b/i,/^(a|c)/i]},defaultParseWidth:"any"}),quarter:s({matchPatterns:{narrow:/^[1234]/i,abbreviated:/^q[1234]/i,wide:/^[1234](th|st|nd|rd)? quarter/i},defaultMatchWidth:"wide",parsePatterns:{any:[/1/i,/2/i,/3/i,/4/i]},defaultParseWidth:"any",valueCallback:e=>e+1}),month:s({matchPatterns:{narrow:/^[jfmasond]/i,abbreviated:/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,wide:/^(january|february|march|april|may|june|july|august|september|october|november|december)/i},defaultMatchWidth:"wide",parsePatterns:{narrow:[/^j/i,/^f/i,/^m/i,/^a/i,/^m/i,/^j/i,/^j/i,/^a/i,/^s/i,/^o/i,/^n/i,/^d/i],any:[/^ja/i,/^f/i,/^mar/i,/^ap/i,/^may/i,/^jun/i,/^jul/i,/^au/i,/^s/i,/^o/i,/^n/i,/^d/i]},defaultParseWidth:"any"}),day:s({matchPatterns:{narrow:/^[smtwf]/i,short:/^(su|mo|tu|we|th|fr|sa)/i,abbreviated:/^(sun|mon|tue|wed|thu|fri|sat)/i,wide:/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i},defaultMatchWidth:"wide",parsePatterns:{narrow:[/^s/i,/^m/i,/^t/i,/^w/i,/^t/i,/^f/i,/^s/i],any:[/^su/i,/^m/i,/^tu/i,/^w/i,/^th/i,/^f/i,/^sa/i]},defaultParseWidth:"any"}),dayPeriod:s({matchPatterns:{narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i},defaultMatchWidth:"any",parsePatterns:{any:{am:/^a/i,pm:/^p/i,midnight:/^mi/i,noon:/^no/i,morning:/morning/i,afternoon:/afternoon/i,evening:/evening/i,night:/night/i}},defaultParseWidth:"any"})},options:{weekStartsOn:0,firstWeekContainsDate:1}};e.s(["enUS",0,l],328607),e.s(["defaultLocale",0,l],55545)},401851,668113,614522,950567,649471,526947,202877,e=>{"use strict";var t=e.i(55545),a=e.i(455024),n=e.i(381515),r=e.i(281092);function i(e,t){let a=(0,r.toDate)(e,t?.in);return a.setFullYear(a.getFullYear(),0,1),a.setHours(0,0,0,0),a}e.s(["startOfYear",0,i],668113);var o=e.i(234662);function s(e,t){let n=(0,a.getDefaultOptions)(),i=t?.weekStartsOn??t?.locale?.options?.weekStartsOn??n.weekStartsOn??n.locale?.options?.weekStartsOn??0,o=(0,r.toDate)(e,t?.in),s=o.getDay();return o.setDate(o.getDate()-(7*(s<i)+s-i)),o.setHours(0,0,0,0),o}function l(e,t){return s(e,{...t,weekStartsOn:1})}e.s(["startOfWeek",0,s],614522),e.s(["startOfISOWeek",0,l],950567);var d=e.i(677241);function c(e,t){let a=(0,r.toDate)(e,t?.in),n=a.getFullYear(),i=(0,d.constructFrom)(a,0);i.setFullYear(n+1,0,4),i.setHours(0,0,0,0);let o=l(i),s=(0,d.constructFrom)(a,0);s.setFullYear(n,0,4),s.setHours(0,0,0,0);let c=l(s);return a.getTime()>=o.getTime()?n+1:a.getTime()>=c.getTime()?n:n-1}function u(e,t){let a,n,i=(0,r.toDate)(e,t?.in);return Math.round((l(i)-(a=c(i,void 0),(n=(0,d.constructFrom)(i,0)).setFullYear(a,0,4),n.setHours(0,0,0,0),l(n)))/o.millisecondsInWeek)+1}function m(e,t){let n=(0,r.toDate)(e,t?.in),i=n.getFullYear(),o=(0,a.getDefaultOptions)(),l=t?.firstWeekContainsDate??t?.locale?.options?.firstWeekContainsDate??o.firstWeekContainsDate??o.locale?.options?.firstWeekContainsDate??1,c=(0,d.constructFrom)(t?.in||e,0);c.setFullYear(i+1,0,l),c.setHours(0,0,0,0);let u=s(c,t),m=(0,d.constructFrom)(t?.in||e,0);m.setFullYear(i,0,l),m.setHours(0,0,0,0);let h=s(m,t);return+n>=+u?i+1:+n>=+h?i:i-1}function h(e,t){let n,i,l,c,u=(0,r.toDate)(e,t?.in);return Math.round((s(u,t)-(n=(0,a.getDefaultOptions)(),i=t?.firstWeekContainsDate??t?.locale?.options?.firstWeekContainsDate??n.firstWeekContainsDate??n.locale?.options?.firstWeekContainsDate??1,l=m(u,t),(c=(0,d.constructFrom)(t?.in||u,0)).setFullYear(l,0,i),c.setHours(0,0,0,0),s(c,t)))/o.millisecondsInWeek)+1}function f(e,t){let a=Math.abs(e).toString().padStart(t,"0");return(e<0?"-":"")+a}e.s(["getISOWeek",0,u],649471),e.s(["getWeek",0,h],526947);let p={y(e,t){let a=e.getFullYear(),n=a>0?a:1-a;return f("yy"===t?n%100:n,t.length)},M(e,t){let a=e.getMonth();return"M"===t?String(a+1):f(a+1,2)},d:(e,t)=>f(e.getDate(),t.length),a(e,t){let a=e.getHours()/12>=1?"pm":"am";switch(t){case"a":case"aa":return a.toUpperCase();case"aaa":return a;case"aaaaa":return a[0];default:return"am"===a?"a.m.":"p.m."}},h:(e,t)=>f(e.getHours()%12||12,t.length),H:(e,t)=>f(e.getHours(),t.length),m:(e,t)=>f(e.getMinutes(),t.length),s:(e,t)=>f(e.getSeconds(),t.length),S(e,t){let a=t.length;return f(Math.trunc(e.getMilliseconds()*Math.pow(10,a-3)),t.length)}},g={G:function(e,t,a){let n=+(e.getFullYear()>0);switch(t){case"G":case"GG":case"GGG":return a.era(n,{width:"abbreviated"});case"GGGGG":return a.era(n,{width:"narrow"});default:return a.era(n,{width:"wide"})}},y:function(e,t,a){if("yo"===t){let t=e.getFullYear();return a.ordinalNumber(t>0?t:1-t,{unit:"year"})}return p.y(e,t)},Y:function(e,t,a,n){let r=m(e,n),i=r>0?r:1-r;return"YY"===t?f(i%100,2):"Yo"===t?a.ordinalNumber(i,{unit:"year"}):f(i,t.length)},R:function(e,t){return f(c(e),t.length)},u:function(e,t){return f(e.getFullYear(),t.length)},Q:function(e,t,a){let n=Math.ceil((e.getMonth()+1)/3);switch(t){case"Q":return String(n);case"QQ":return f(n,2);case"Qo":return a.ordinalNumber(n,{unit:"quarter"});case"QQQ":return a.quarter(n,{width:"abbreviated",context:"formatting"});case"QQQQQ":return a.quarter(n,{width:"narrow",context:"formatting"});default:return a.quarter(n,{width:"wide",context:"formatting"})}},q:function(e,t,a){let n=Math.ceil((e.getMonth()+1)/3);switch(t){case"q":return String(n);case"qq":return f(n,2);case"qo":return a.ordinalNumber(n,{unit:"quarter"});case"qqq":return a.quarter(n,{width:"abbreviated",context:"standalone"});case"qqqqq":return a.quarter(n,{width:"narrow",context:"standalone"});default:return a.quarter(n,{width:"wide",context:"standalone"})}},M:function(e,t,a){let n=e.getMonth();switch(t){case"M":case"MM":return p.M(e,t);case"Mo":return a.ordinalNumber(n+1,{unit:"month"});case"MMM":return a.month(n,{width:"abbreviated",context:"formatting"});case"MMMMM":return a.month(n,{width:"narrow",context:"formatting"});default:return a.month(n,{width:"wide",context:"formatting"})}},L:function(e,t,a){let n=e.getMonth();switch(t){case"L":return String(n+1);case"LL":return f(n+1,2);case"Lo":return a.ordinalNumber(n+1,{unit:"month"});case"LLL":return a.month(n,{width:"abbreviated",context:"standalone"});case"LLLLL":return a.month(n,{width:"narrow",context:"standalone"});default:return a.month(n,{width:"wide",context:"standalone"})}},w:function(e,t,a,n){let r=h(e,n);return"wo"===t?a.ordinalNumber(r,{unit:"week"}):f(r,t.length)},I:function(e,t,a){let n=u(e);return"Io"===t?a.ordinalNumber(n,{unit:"week"}):f(n,t.length)},d:function(e,t,a){return"do"===t?a.ordinalNumber(e.getDate(),{unit:"date"}):p.d(e,t)},D:function(e,t,a){let o,s=(o=(0,r.toDate)(e,void 0),(0,n.differenceInCalendarDays)(o,i(o))+1);return"Do"===t?a.ordinalNumber(s,{unit:"dayOfYear"}):f(s,t.length)},E:function(e,t,a){let n=e.getDay();switch(t){case"E":case"EE":case"EEE":return a.day(n,{width:"abbreviated",context:"formatting"});case"EEEEE":return a.day(n,{width:"narrow",context:"formatting"});case"EEEEEE":return a.day(n,{width:"short",context:"formatting"});default:return a.day(n,{width:"wide",context:"formatting"})}},e:function(e,t,a,n){let r=e.getDay(),i=(r-n.weekStartsOn+8)%7||7;switch(t){case"e":return String(i);case"ee":return f(i,2);case"eo":return a.ordinalNumber(i,{unit:"day"});case"eee":return a.day(r,{width:"abbreviated",context:"formatting"});case"eeeee":return a.day(r,{width:"narrow",context:"formatting"});case"eeeeee":return a.day(r,{width:"short",context:"formatting"});default:return a.day(r,{width:"wide",context:"formatting"})}},c:function(e,t,a,n){let r=e.getDay(),i=(r-n.weekStartsOn+8)%7||7;switch(t){case"c":return String(i);case"cc":return f(i,t.length);case"co":return a.ordinalNumber(i,{unit:"day"});case"ccc":return a.day(r,{width:"abbreviated",context:"standalone"});case"ccccc":return a.day(r,{width:"narrow",context:"standalone"});case"cccccc":return a.day(r,{width:"short",context:"standalone"});default:return a.day(r,{width:"wide",context:"standalone"})}},i:function(e,t,a){let n=e.getDay(),r=0===n?7:n;switch(t){case"i":return String(r);case"ii":return f(r,t.length);case"io":return a.ordinalNumber(r,{unit:"day"});case"iii":return a.day(n,{width:"abbreviated",context:"formatting"});case"iiiii":return a.day(n,{width:"narrow",context:"formatting"});case"iiiiii":return a.day(n,{width:"short",context:"formatting"});default:return a.day(n,{width:"wide",context:"formatting"})}},a:function(e,t,a){let n=e.getHours()/12>=1?"pm":"am";switch(t){case"a":case"aa":return a.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"aaa":return a.dayPeriod(n,{width:"abbreviated",context:"formatting"}).toLowerCase();case"aaaaa":return a.dayPeriod(n,{width:"narrow",context:"formatting"});default:return a.dayPeriod(n,{width:"wide",context:"formatting"})}},b:function(e,t,a){let n,r=e.getHours();switch(n=12===r?"noon":0===r?"midnight":r/12>=1?"pm":"am",t){case"b":case"bb":return a.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"bbb":return a.dayPeriod(n,{width:"abbreviated",context:"formatting"}).toLowerCase();case"bbbbb":return a.dayPeriod(n,{width:"narrow",context:"formatting"});default:return a.dayPeriod(n,{width:"wide",context:"formatting"})}},B:function(e,t,a){let n,r=e.getHours();switch(n=r>=17?"evening":r>=12?"afternoon":r>=4?"morning":"night",t){case"B":case"BB":case"BBB":return a.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"BBBBB":return a.dayPeriod(n,{width:"narrow",context:"formatting"});default:return a.dayPeriod(n,{width:"wide",context:"formatting"})}},h:function(e,t,a){if("ho"===t){let t=e.getHours()%12;return 0===t&&(t=12),a.ordinalNumber(t,{unit:"hour"})}return p.h(e,t)},H:function(e,t,a){return"Ho"===t?a.ordinalNumber(e.getHours(),{unit:"hour"}):p.H(e,t)},K:function(e,t,a){let n=e.getHours()%12;return"Ko"===t?a.ordinalNumber(n,{unit:"hour"}):f(n,t.length)},k:function(e,t,a){let n=e.getHours();return(0===n&&(n=24),"ko"===t)?a.ordinalNumber(n,{unit:"hour"}):f(n,t.length)},m:function(e,t,a){return"mo"===t?a.ordinalNumber(e.getMinutes(),{unit:"minute"}):p.m(e,t)},s:function(e,t,a){return"so"===t?a.ordinalNumber(e.getSeconds(),{unit:"second"}):p.s(e,t)},S:function(e,t){return p.S(e,t)},X:function(e,t,a){let n=e.getTimezoneOffset();if(0===n)return"Z";switch(t){case"X":return w(n);case"XXXX":case"XX":return x(n);default:return x(n,":")}},x:function(e,t,a){let n=e.getTimezoneOffset();switch(t){case"x":return w(n);case"xxxx":case"xx":return x(n);default:return x(n,":")}},O:function(e,t,a){let n=e.getTimezoneOffset();switch(t){case"O":case"OO":case"OOO":return"GMT"+b(n,":");default:return"GMT"+x(n,":")}},z:function(e,t,a){let n=e.getTimezoneOffset();switch(t){case"z":case"zz":case"zzz":return"GMT"+b(n,":");default:return"GMT"+x(n,":")}},t:function(e,t,a){return f(Math.trunc(e/1e3),t.length)},T:function(e,t,a){return f(+e,t.length)}};function b(e,t=""){let a=e>0?"-":"+",n=Math.abs(e),r=Math.trunc(n/60),i=n%60;return 0===i?a+String(r):a+String(r)+t+f(i,2)}function w(e,t){return e%60==0?(e>0?"-":"+")+f(Math.abs(e)/60,2):x(e,t)}function x(e,t=""){let a=Math.abs(e);return(e>0?"-":"+")+f(Math.trunc(a/60),2)+t+f(a%60,2)}let y=(e,t)=>{switch(e){case"P":return t.date({width:"short"});case"PP":return t.date({width:"medium"});case"PPP":return t.date({width:"long"});default:return t.date({width:"full"})}},v=(e,t)=>{switch(e){case"p":return t.time({width:"short"});case"pp":return t.time({width:"medium"});case"ppp":return t.time({width:"long"});default:return t.time({width:"full"})}},S={p:v,P:(e,t)=>{let a,n=e.match(/(P+)(p+)?/)||[],r=n[1],i=n[2];if(!i)return y(e,t);switch(r){case"P":a=t.dateTime({width:"short"});break;case"PP":a=t.dateTime({width:"medium"});break;case"PPP":a=t.dateTime({width:"long"});break;default:a=t.dateTime({width:"full"})}return a.replace("{{date}}",y(r,t)).replace("{{time}}",v(i,t))}},j=/^D+$/,k=/^Y+$/,$=["D","DD","YY","YYYY"];function N(e){return e instanceof Date||"object"==typeof e&&"[object Date]"===Object.prototype.toString.call(e)}e.s(["isDate",0,N],202877);let D=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,P=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,M=/^'([^]*?)'?$/,C=/''/g,z=/[a-zA-Z]/;e.s(["format",0,function(e,n,i){let o=(0,a.getDefaultOptions)(),s=i?.locale??o.locale??t.defaultLocale,l=i?.firstWeekContainsDate??i?.locale?.options?.firstWeekContainsDate??o.firstWeekContainsDate??o.locale?.options?.firstWeekContainsDate??1,d=i?.weekStartsOn??i?.locale?.options?.weekStartsOn??o.weekStartsOn??o.locale?.options?.weekStartsOn??0,c=(0,r.toDate)(e,i?.in);if(!N(c)&&"number"!=typeof c||isNaN(+(0,r.toDate)(c)))throw RangeError("Invalid time value");let u=n.match(P).map(e=>{let t=e[0];return"p"===t||"P"===t?(0,S[t])(e,s.formatLong):e}).join("").match(D).map(e=>{if("''"===e)return{isToken:!1,value:"'"};let t=e[0];if("'"===t){var a;let t;return{isToken:!1,value:(t=(a=e).match(M))?t[1].replace(C,"'"):a}}if(g[t])return{isToken:!0,value:e};if(t.match(z))throw RangeError("Format string contains an unescaped latin alphabet character `"+t+"`");return{isToken:!1,value:e}});s.localize.preprocessor&&(u=s.localize.preprocessor(c,u));let m={firstWeekContainsDate:l,weekStartsOn:d,locale:s};return u.map(t=>{if(!t.isToken)return t.value;let a=t.value;return(!i?.useAdditionalWeekYearTokens&&k.test(a)||!i?.useAdditionalDayOfYearTokens&&j.test(a))&&function(e,t,a){var n,r,i;let o,s=(n=e,r=t,i=a,o="Y"===n[0]?"years":"days of the month",`Use \`${n.toLowerCase()}\` instead of \`${n}\` (in \`${r}\`) for formatting ${o} to the input \`${i}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`);if(console.warn(s),$.includes(e))throw RangeError(s)}(a,n,String(e)),(0,g[a[0]])(c,a,s.localize,m)}).join("")}],401851)},142791,e=>{"use strict";var t=e.i(843476),a=e.i(271645),n=e.i(618566),r=e.i(78549),i=e.i(544774),o=e.i(734426),s=e.i(850485),l=e.i(111061),d=e.i(994566),c=e.i(201584),u=e.i(479431);e.i(347926);var m=e.i(146712),h=e.i(203541),f=e.i(455424),p=e.i(15306),g=e.i(876062),b=e.i(522772),w=e.i(423144),x=e.i(375460),y=e.i(511841);e.s(["default",0,function(){let e=(0,n.useRouter)(),[v,S]=(0,a.useState)("contacts"),[j,k]=(0,a.useState)([]),[$,N]=(0,a.useState)(null),[D,P]=(0,a.useState)(!0),[M,C]=(0,a.useState)(!1),[z,T]=(0,a.useState)(!0),[E,O]=(0,a.useState)(!1),[F,W]=(0,a.useState)(!1),[R,A]=(0,a.useState)(null),q=i.trpc.resume.create.useMutation(),H=i.trpc.resume.update.useMutation();if((0,a.useEffect)(()=>{let t=localStorage.getItem("selectedTemplateId"),a=localStorage.getItem("showPhoto");if(a)try{W(JSON.parse(a))}catch{W(!1)}if(!t||!x.resumeTemplates.find(e=>e.id===t))return void e.push("/resume/templates");let n=localStorage.getItem("currentResumeId");if(n){A(n);let e=localStorage.getItem("resumeData");if(e)try{let a=JSON.parse(e);a.templateId===t?N(a):N((0,w.createEmptyResumeData)(t))}catch{N((0,w.createEmptyResumeData)(t))}else N((0,w.createEmptyResumeData)(t));T(!1)}else N((0,w.createEmptyResumeData)(t)),q.mutateAsync({title:"Resume_1",templateId:t}).then(e=>{A(e.id),localStorage.setItem("currentResumeId",e.id)}).catch(e=>{console.error("Failed to create resume:",e)}).finally(()=>{T(!1)})},[e]),(0,a.useEffect)(()=>{if($&&(localStorage.setItem("resumeData",JSON.stringify($)),R)){let e=setTimeout(()=>{H.mutate({id:R,data:$,lastEditedSection:v,status:"draft"})},1e3);return()=>clearTimeout(e)}},[$,R,v]),z||!$)return(0,t.jsx)("div",{className:"flex items-center justify-center min-h-screen",children:(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)(o.Spinner,{className:"mx-auto mb-4 size-12 text-muted-foreground"}),(0,t.jsx)("p",{className:"text-muted-foreground",children:"Loading your resume..."})]})});let L=w.RESUME_STEPS.findIndex(e=>e.id===v),Y=0===L,I=L===w.RESUME_STEPS.length-1,B=e=>{W(e),localStorage.setItem("showPhoto",JSON.stringify(e))};return(0,t.jsxs)("div",{className:"h-screen bg-background flex flex-col overflow-hidden",children:[(0,t.jsx)("div",{className:"flex-1 flex overflow-hidden",children:(0,t.jsxs)("div",{className:"flex flex-col lg:flex-row w-full h-full",children:[(0,t.jsx)("div",{className:`${D?"lg:w-1/2":"w-full"} flex flex-col h-full overflow-auto`,children:(0,t.jsxs)("div",{className:"flex-1 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6",children:[(0,t.jsx)("div",{className:"bg-background border rounded-lg shadow-sm mb-4 p-3 sm:p-4",children:(0,t.jsx)(l.StepIndicator,{currentStep:v,completedSteps:j,onStepClick:e=>{S(e)}})}),(0,t.jsx)("div",{className:"bg-background rounded-lg border p-4 sm:p-6 mb-4",children:(()=>{switch(v){case"contacts":return(0,t.jsx)(m.ContactsForm,{data:$.contact,onChange:e=>N({...$,contact:e}),showPhoto:F,onShowPhotoChange:B});case"experience":return(0,t.jsx)(h.ExperienceForm,{data:$.experiences,onChange:e=>N({...$,experiences:e})});case"education":return(0,t.jsx)(f.EducationForm,{data:$.educations,onChange:e=>N({...$,educations:e})});case"skills":return(0,t.jsx)(p.SkillsForm,{data:$.skills,onChange:e=>N({...$,skills:e})});case"summary":return(0,t.jsx)(g.SummaryForm,{data:$.summary,onChange:e=>N({...$,summary:e})});case"finalize":return(0,t.jsx)(b.FinalizeForm,{data:$.finalize,onChange:e=>N({...$,finalize:e})});default:return null}})()}),(0,t.jsx)("div",{className:`fixed bottom-0 left-0 bg-background border-t p-3 sm:p-4 z-30 ${D?"lg:w-1/2 w-full":"w-full"}`,children:(0,t.jsxs)("div",{className:"flex items-center justify-between px-2 sm:px-4",children:[(0,t.jsxs)(r.Button,{variant:"outline",onClick:()=>{Y||S(w.RESUME_STEPS[L-1].id)},disabled:Y,size:"sm",className:"sm:size-default",children:[(0,t.jsx)(y.ArrowLeft,{className:"mr-1 sm:mr-2 h-4 w-4"}),(0,t.jsx)("span",{className:"hidden sm:inline",children:"Back"})]}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsxs)(s.Sheet,{modal:!1,open:E,onOpenChange:O,children:[(0,t.jsx)(s.SheetTrigger,{asChild:!0,children:(0,t.jsxs)(r.Button,{variant:"outline",size:"sm",className:"lg:hidden",children:[(0,t.jsx)(y.Eye,{className:"mr-2 h-4 w-4"}),"View Resume"]})}),(0,t.jsxs)(s.SheetContent,{side:"bottom",className:"h-[90vh] overflow-hidden",children:[(0,t.jsxs)(s.SheetHeader,{children:[(0,t.jsx)(s.SheetTitle,{children:"Resume Preview"}),(0,t.jsx)(s.SheetDescription,{children:"Preview your resume in real-time"})]}),(0,t.jsx)("div",{className:"mt-4 h-[calc(90vh-100px)] overflow-hidden",children:(0,t.jsx)(c.PinchZoomContainer,{className:"rounded-md bg-muted/20",children:(0,t.jsx)(d.ResumePreview,{data:$,className:"shadow-none",showPhoto:F})})})]})]}),(0,t.jsx)(r.Button,{variant:"ghost",size:"sm",onClick:()=>P(!D),className:"hidden lg:flex",children:D?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(y.EyeOff,{className:"mr-2 h-4 w-4"}),"Hide Preview"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(y.Eye,{className:"mr-2 h-4 w-4"}),"Show Preview"]})}),I?(0,t.jsxs)(r.Button,{onClick:()=>e.push("/resume/final-resume"),size:"sm",className:"sm:size-default",children:[(0,t.jsx)(y.Download,{className:"mr-1 sm:mr-2 h-4 w-4"}),(0,t.jsx)("span",{className:"hidden sm:inline",children:"Download"})]}):(0,t.jsxs)(r.Button,{onClick:()=>{I||(j.includes(v)||k([...j,v]),S(w.RESUME_STEPS[L+1].id))},size:"sm",className:"sm:size-default",children:[(0,t.jsx)("span",{className:"hidden sm:inline",children:I?"Download Resume":`${w.RESUME_STEPS[L+1].label}`}),(0,t.jsx)("span",{className:"sm:hidden",children:"Next"}),(0,t.jsx)(y.ArrowRight,{className:"ml-1 sm:ml-2 h-4 w-4"})]})]})]})})]})}),D&&(0,t.jsx)("div",{className:"hidden lg:block lg:w-1/2 h-full overflow-auto py-6 px-8 bg-zinc-50 dark:bg-zinc-900",children:(0,t.jsx)(d.ResumePreview,{data:$,className:"h-full",showPhoto:F})})]})}),(0,t.jsx)(u.DownloadDialog,{data:$,isOpen:M,onClose:()=>C(!1)})]})}])}]);