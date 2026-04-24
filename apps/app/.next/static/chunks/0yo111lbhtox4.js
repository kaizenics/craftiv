(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,457369,928609,e=>{"use strict";let t=["modern-ats","professional","executive","minimal-serif","clean-block","sidebar-contact","elegant-line"],a="modern-ats",i=e=>!!e&&t.includes(e),o=()=>({contact:{firstName:"",lastName:"",email:"",phone:"",address:"",city:""},employer:{hiringManagerName:"",companyName:"",companyAddress:"",jobTitle:""},content:"",date:new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),templateId:a});e.s(["DEFAULT_COVER_LETTER_TEMPLATE_ID",0,a,"createEmptyCoverLetterData",0,o,"isCoverLetterTemplateId",0,i,"normalizeCoverLetterData",0,e=>{let t=o();return{contact:{...t.contact,...e?.contact??{}},employer:{...t.employer,...e?.employer??{}},content:e?.content??t.content,date:e?.date??t.date,templateId:i(e?.templateId)?e.templateId:t.templateId}}],928609);let r=[{id:"modern-ats",name:"Modern ATS",description:"Simple single-column layout with standard fonts and clean spacing for ATS parsing.",badge:"ATS Ready"},{id:"professional",name:"Professional",description:"Classic business presentation with formal hierarchy for leadership and client-facing roles.",badge:"Traditional"},{id:"executive",name:"Executive",description:"Senior-level cover letter style with measured hierarchy, formal spacing, and ATS-safe structure.",badge:"Leadership",accentColor:"#0f766e"},{id:"minimal-serif",name:"Minimal Serif",description:"A restrained serif presentation that feels polished while keeping a simple single-column ATS layout.",badge:"Refined",accentColor:"#7c2d12"},{id:"clean-block",name:"Clean Block",description:"Modern contact block and crisp section rhythm for applicants who want a contemporary ATS-ready look.",badge:"Modern",accentColor:"#1d4ed8"},{id:"sidebar-contact",name:"Sidebar Contact",description:"Distinctive left rail for contact details in preview and export while maintaining readable letter flow.",badge:"Structured",accentColor:"#4338ca"},{id:"elegant-line",name:"Elegant Line",description:"Light editorial styling with disciplined dividers and conservative typography for ATS compatibility.",badge:"Editorial",accentColor:"#be123c"}],n=e=>i(e)?e:a;e.s(["coverLetterTemplates",0,r,"getCoverLetterTemplate",0,e=>{let t=n(e);return r.find(e=>e.id===t)??r[0]},"normalizeCoverLetterTemplateId",0,n],457369)},734426,e=>{"use strict";var t=e.i(843476),a=e.i(718938),i=e.i(511841);e.s(["Spinner",0,function({className:e,...o}){return(0,t.jsx)(i.Loader2,{role:"status","aria-label":"Loading",className:(0,a.cn)("size-4 animate-spin",e),...o})}])},674094,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(248425),o=a.forwardRef((e,a)=>(0,t.jsx)(i.Primitive.label,{...e,ref:a,onMouseDown:t=>{t.target.closest("button, input, select, textarea")||(e.onMouseDown?.(t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));o.displayName="Label",e.s(["Label",0,o,"Root",0,o],444461);var r=e.i(444461),r=r,n=e.i(718938);e.s(["Label",0,function({className:e,...a}){return(0,t.jsx)(r.Root,{"data-slot":"label",className:(0,n.cn)("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",e),...a})}],674094)},199863,964053,e=>{"use strict";var t=e.i(843476),a=e.i(326999);e.s(["Dialog",0,a],964053);var a=a,i=e.i(718938),o=e.i(78549);e.i(197379);var r=e.i(472804),n=e.i(568275);function s({...e}){return(0,t.jsx)(a.Portal,{"data-slot":"dialog-portal",...e})}function l({className:e,...o}){return(0,t.jsx)(a.Overlay,{"data-slot":"dialog-overlay",className:(0,i.cn)("fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",e),...o})}e.s(["Dialog",0,function({...e}){return(0,t.jsx)(a.Root,{"data-slot":"dialog",...e})},"DialogContent",0,function({className:e,children:d,showCloseButton:c=!0,...p}){return(0,t.jsxs)(s,{children:[(0,t.jsx)(l,{}),(0,t.jsxs)(a.Content,{"data-slot":"dialog-content",className:(0,i.cn)("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",e),...p,children:[d,c&&(0,t.jsx)(a.Close,{"data-slot":"dialog-close",asChild:!0,children:(0,t.jsxs)(o.Button,{variant:"ghost",className:"absolute top-4 right-4",size:"icon-sm",children:[(0,t.jsx)(r.HugeiconsIcon,{icon:n.Cancel01Icon,strokeWidth:2}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})})]})]})},"DialogDescription",0,function({className:e,...o}){return(0,t.jsx)(a.Description,{"data-slot":"dialog-description",className:(0,i.cn)("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",e),...o})},"DialogFooter",0,function({className:e,showCloseButton:r=!1,children:n,...s}){return(0,t.jsxs)("div",{"data-slot":"dialog-footer",className:(0,i.cn)("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",e),...s,children:[n,r&&(0,t.jsx)(a.Close,{asChild:!0,children:(0,t.jsx)(o.Button,{variant:"outline",children:"Close"})})]})},"DialogHeader",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"dialog-header",className:(0,i.cn)("flex flex-col gap-2",e),...a})},"DialogTitle",0,function({className:e,...o}){return(0,t.jsx)(a.Title,{"data-slot":"dialog-title",className:(0,i.cn)("font-heading text-base leading-none font-medium",e),...o})}],199863)},959411,e=>{"use strict";var t=e.i(271645),a=e.i(248425),i=e.i(843476),o=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),r=t.forwardRef((e,t)=>(0,i.jsx)(a.Primitive.span,{...e,ref:t,style:{...o,...e.style}}));r.displayName="VisuallyHidden",e.s(["Root",0,r,"VISUALLY_HIDDEN_STYLES",0,o])},479431,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(618566),o=e.i(78549),r=e.i(674094),n=e.i(734426),s=e.i(199863),l=e.i(375460),d=e.i(994566),c=e.i(511841);async function p({data:e,template:t,fileName:a,designOptions:i,customColor:o}){let r=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(r||(r=document.querySelector("[data-resume-preview]")),!r)throw Error("Resume preview element not found. Please ensure the resume is rendered on the page.");let n=r.cloneNode(!0);!function(e,t){let a=[e,...Array.from(e.querySelectorAll("*"))],i=[t,...Array.from(t.querySelectorAll("*"))],o=Math.min(a.length,i.length);for(let e=0;e<o;e++){let t=a[e],o=i[e];if(!(o instanceof HTMLElement))continue;let r=window.getComputedStyle(t),n=Array.from(r).map(e=>`${e}:${r.getPropertyValue(e)};`).join("");o.style.cssText=n}}(r,n),n.querySelectorAll("img").forEach(e=>{let t=e.getAttribute("src");if(t)try{let a=new URL(t,window.location.origin).toString();e.setAttribute("src",a)}catch{}});let s=window.getComputedStyle(r).backgroundColor||"#ffffff";n.querySelectorAll("button, input, select, textarea, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]").forEach(e=>{e.remove()});let l=Array.from(document.querySelectorAll('head link[rel="preconnect"], head link[rel="stylesheet"]')).filter(e=>{let t=e.getAttribute("href")||"";return t.includes("fonts.googleapis.com")||t.includes("fonts.gstatic.com")}).map(e=>e.outerHTML).join("\n"),d=`
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
    ${n.outerHTML}
  </body>
</html>
  `.trim(),c=await fetch("/api/resume/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:d,fileName:a})});if(!c.ok){let e=await c.text();throw Error(`Failed to generate PDF: ${e}`)}let m=await c.blob(),u=URL.createObjectURL(m),f=document.createElement("a");f.href=u,f.download=`${a}.pdf`,document.body.appendChild(f),f.click(),f.remove(),URL.revokeObjectURL(u)}let m={fontFamily:"Inter, sans-serif",fontSize:11,lineSpacing:1.6,sectionSpacing:20,paragraphSpacing:12};function u(e,t){return`
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
  `}let f=["display","position","top","right","bottom","left","float","clear","width","height","max-width","max-height","min-width","min-height","margin","margin-top","margin-right","margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom","padding-left","border","border-top","border-right","border-bottom","border-left","border-radius","box-sizing","background","background-color","color","font","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-transform","text-decoration","white-space","word-break","overflow","overflow-x","overflow-y","flex","flex-direction","flex-wrap","justify-content","align-items","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","opacity"];async function g({data:e,template:t,fileName:a,designOptions:i,customColor:o}){let r,n=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(n){var s;let e,t,a=n.cloneNode(!0);a.style.width="210mm",a.style.maxWidth="210mm",a.style.minHeight="auto",a.style.margin="0 auto",a.style.backgroundColor="#ffffff",a.style.borderRadius="0",a.style.boxShadow="none",a.style.overflow="visible",a.style.height="auto";let i=a.querySelector("[data-resume-content]");i&&(i.style.overflow="visible",i.style.height="auto",i.style.maxHeight="none"),e=[n,...Array.from(n.querySelectorAll("*"))],t=[a,...Array.from(a.querySelectorAll("*"))],e.forEach((e,a)=>{let i=t[a];if(!(e instanceof HTMLElement)||!i)return;let o=window.getComputedStyle(e),r=f.map(e=>`${e}:${o.getPropertyValue(e)};`).join("");i.setAttribute("style",r)}),a.querySelectorAll("[data-preview-header], [data-preview-footer], [data-page-break-indicator], button, input, select").forEach(e=>{e.remove()}),s=a.outerHTML,r=`
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
  `}else r=function({data:e,template:t,designOptions:a}){var i,o,r,n,s,l,d,c,p,m,f,g;let h=t.layout||"classic",b="harvard"===h,x=`
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
      `}}(h,t.primaryColor,a)}</style>`;return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${e.contact.firstName} ${e.contact.lastName} - Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      ${x}
    </head>
    <body>
      ${i=e,`
    <div class="header">
      <div class="name">${i.contact.firstName||"Your"} ${i.contact.lastName||"Name"}</div>
      ${i.contact.desiredJobTitle?`<div class="title">${i.contact.desiredJobTitle}</div>`:""}
      <div class="contact-info">
        ${[i.contact.email,i.contact.phone].filter(Boolean).join(" | ")}
      </div>
    </div>
  `}
      ${!b&&e.summary?(o=e.summary,`
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${o}</div>
    </div>
  `):""}
      ${b&&e.educations.length>0?u(e.educations,b):""}
      ${e.experiences.length>0?(r=e.experiences,n=b,`
    <div class="section">
      <div class="section-title">Experience</div>
      ${r.map(e=>`
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${n?e.employer:e.jobTitle}${!n&&e.employer?`, ${e.employer}`:""}</span>
            <span class="entry-date">${e.startDate} - ${e.isCurrentJob?"Present":e.endDate}</span>
          </div>
          ${n?`<div class="entry-position">${e.jobTitle}</div>`:""}
          ${e.location?`<div class="entry-subtitle">${e.location}</div>`:""}
          ${e.description?`<div class="entry-description">${e.description}</div>`:""}
        </div>
      `).join("")}
    </div>
  `):""}
      ${!b&&e.educations.length>0?u(e.educations,b):""}
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
      ${e.finalize.awards.length>0?(p=e.finalize.awards,`
    <div class="section">
      <div class="section-title">Awards & Honors</div>
      ${p.map(e=>`<div>${e.title} - ${e.issuer} (${e.date})</div>`).join("")}
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
      ${e.finalize.hobbies.length>0?(g=e.finalize.hobbies,`
    <div class="section">
      <div class="section-title">Hobbies & Interests</div>
      <div>${g.map(e=>e.name).join(", ")}</div>
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
  `}({data:e,template:{primaryColor:o||t.primaryColor,layout:t.layout||"classic"},designOptions:i});let l=new Blob([r],{type:"application/msword"}),d=URL.createObjectURL(l),c=document.createElement("a");c.href=d,c.download=`${a}.doc`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(d)}e.s(["DownloadDialog",0,function({data:e,isOpen:u,onClose:f,designOptions:h=m,customFileName:b,customColor:x,showPhoto:v=!1,onDownloadComplete:y}){let w=(0,i.useRouter)(),[$,j]=(0,a.useState)("pdf"),[C,N]=(0,a.useState)(!1),[S,k]=(0,a.useState)(!1),R=l.resumeTemplates.find(t=>t.id===e.templateId)||l.resumeTemplates[0],T=b||`${e.contact.firstName||"Resume"}_${e.contact.lastName||"CV"}`,z=async()=>{if(S)return void w.push("/dashboard");N(!0);try{"pdf"===$?(await new Promise(e=>setTimeout(e,100)),await p({data:e,template:R,fileName:T,designOptions:h,customColor:x})):await g({data:e,template:R,fileName:T,designOptions:h,customColor:x}),k(!0),y&&y()}catch(e){console.error("Download failed:",e),alert("Failed to generate resume. Please try again.")}finally{N(!1)}};return((0,a.useEffect)(()=>{u&&setTimeout(()=>{let e=document.querySelector("[data-resume-export-preview] [data-resume-preview]");e&&e.getBoundingClientRect()},50)},[u]),u)?(0,t.jsxs)(t.Fragment,{children:[u&&(0,t.jsx)("div",{"data-resume-export-preview":!0,style:{position:"fixed",left:"-10000px",top:0,width:"210mm",height:"auto",overflow:"visible",visibility:"visible"},children:(0,t.jsx)(d.ResumePreview,{data:e,designOptions:h,customColor:x,showPhoto:v,showScore:!1,showFooter:!1,plain:!0,renderAllPages:!0})}),(0,t.jsx)(s.Dialog,{open:u,onOpenChange:f,children:(0,t.jsxs)(s.DialogContent,{className:"sm:max-w-md",children:[(0,t.jsxs)(s.DialogHeader,{children:[(0,t.jsx)("div",{className:"flex justify-center mb-4",children:(0,t.jsx)("div",{className:"inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10",children:(0,t.jsx)(c.Download,{className:"h-6 w-6 text-primary"})})}),(0,t.jsx)(s.DialogTitle,{className:"text-center",children:"Download Your Resume"}),(0,t.jsx)(s.DialogDescription,{className:"text-center",children:"Choose your preferred format"})]}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsx)(r.Label,{className:"text-sm font-medium",children:"Select Format"}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,t.jsxs)("button",{onClick:()=>j("pdf"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"pdf"===$?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.FileText,{className:`h-8 w-8 ${"pdf"===$?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"PDF"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Best for sharing"})]}),(0,t.jsxs)("button",{onClick:()=>j("docx"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"docx"===$?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.File,{className:`h-8 w-8 ${"docx"===$?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"DOCX"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Easy to edit"})]})]}),(0,t.jsxs)("div",{className:"bg-muted/50 rounded-lg p-3 text-sm",children:[(0,t.jsxs)("p",{className:"font-medium mb-1",children:["File: ",T,".",$]}),(0,t.jsxs)("p",{className:"text-muted-foreground text-xs",children:["Template: ",R.name]})]}),(0,t.jsxs)("div",{className:"flex gap-3 pt-2",children:[(0,t.jsx)(o.Button,{variant:"outline",onClick:f,className:"flex-1",children:"Cancel"}),(0,t.jsx)(o.Button,{onClick:z,disabled:C,className:"flex-1",children:C?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.Spinner,{className:"mr-2 h-4 w-4"}),"Downloading..."]}):S?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.ArrowRight,{className:"mr-2 h-4 w-4"}),"Go To Dashboard"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.Download,{className:"mr-2 h-4 w-4"}),"Download ",$.toUpperCase()]})})]})]})]})})]}):null}],479431)},294912,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(904528);let o=210/25.4*96,r=297/25.4*96;e.s(["CoverLetterCardPreview",0,function({data:e}){let n=(0,a.useRef)(null),[s,l]=(0,a.useState)(.15);return(0,a.useEffect)(()=>{let e=n.current;if(!e)return;let t=()=>{let{width:t,height:a}=e.getBoundingClientRect();t&&a&&l(Math.max(.05,.98*Math.min(t/o,a/r)))};t();let a=new ResizeObserver(t);return a.observe(e),()=>a.disconnect()},[]),(0,t.jsx)("div",{ref:n,className:"flex h-full w-full items-start justify-center overflow-hidden bg-white",children:(0,t.jsx)("div",{className:"relative overflow-hidden",style:{pointerEvents:"none",width:`${o*s}px`,height:`${r*s}px`},children:(0,t.jsx)("div",{style:{width:`${o}px`,height:`${r}px`,transform:`scale(${s})`,transformOrigin:"top left"},children:(0,t.jsx)(i.CoverLetterPreview,{data:e,className:"h-full max-w-none rounded-none border-0 shadow-none"})})})})}])},748004,409423,e=>{"use strict";var t=e.i(843476),a=e.i(511841),i=e.i(522016);e.s(["CreateResumeCard",0,function(){return(0,t.jsxs)(i.default,{href:"/resume/templates",className:"group flex flex-col items-start gap-4 rounded-xl border-2 border-dashed border-border bg-card p-6 transition-all hover:border-muted/20 hover:shadow-md sm:flex-row sm:items-center",children:[(0,t.jsx)("div",{className:"flex h-24 w-20 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800",children:(0,t.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted-foreground transition-transform group-hover:scale-110",children:(0,t.jsx)(a.Plus,{className:"h-6 w-6"})})}),(0,t.jsxs)("div",{className:"space-y-1",children:[(0,t.jsx)("h3",{className:"font-semibold text-foreground",children:"Create a New Resume"}),(0,t.jsx)("p",{className:"text-sm text-muted-foreground",children:"Start from scratch or upload a resume to edit it."})]})]})}],748004);var o=e.i(271645),r=e.i(994566),n=e.i(357136);let s=210/25.4*96,l=297/25.4*96;e.s(["ResumeCardPreview",0,function({templateId:e,data:a}){let i=(0,o.useRef)(null),[d,c]=(0,o.useState)(.15),p=n.templates.find(t=>t.id===e),m=p?.primaryColor??"#374151",u={templateId:e,contact:a?.contact??{firstName:"",lastName:"",desiredJobTitle:"",phone:"",email:""},experiences:a?.experiences??[],educations:a?.educations??[],skills:a?.skills??[],summary:a?.summary??"",finalize:a?.finalize??{languages:[],certifications:[],awards:[],websites:[],references:[],hobbies:[],customSections:[]}};return(0,o.useEffect)(()=>{let e=i.current;if(!e)return;let t=()=>{let{width:t,height:a}=e.getBoundingClientRect();t&&a&&c(Math.max(.05,.98*Math.min(t/s,a/l)))};t();let a=new ResizeObserver(t);return a.observe(e),()=>a.disconnect()},[]),(0,t.jsx)("div",{ref:i,className:"flex h-full w-full items-start justify-center overflow-hidden bg-white",children:(0,t.jsx)("div",{className:"relative overflow-hidden",style:{pointerEvents:"none",width:`${s*d}px`,height:`${l*d}px`},children:(0,t.jsx)("div",{style:{width:`${s}px`,height:`${l}px`,transform:`scale(${d})`,transformOrigin:"top left"},children:(0,t.jsx)(r.ResumePreview,{data:u,customColor:m,showPhoto:!1,showScore:!1,showFooter:!1,plain:!0})})})})}],409423)},533637,e=>{"use strict";var t=e.i(843476),a=e.i(225913),i=e.i(271645),o=e.i(981140),r=e.i(30030),n=e.i(842727),s=e.i(296626),l=e.i(248425),d=e.i(586318),c=e.i(369340),p=e.i(610772),m="Tabs",[u,f]=(0,r.createContextScope)(m,[n.createRovingFocusGroupScope]),g=(0,n.createRovingFocusGroupScope)(),[h,b]=u(m),x=i.forwardRef((e,a)=>{let{__scopeTabs:i,value:o,onValueChange:r,defaultValue:n,orientation:s="horizontal",dir:u,activationMode:f="automatic",...g}=e,b=(0,d.useDirection)(u),[x,v]=(0,c.useControllableState)({prop:o,onChange:r,defaultProp:n??"",caller:m});return(0,t.jsx)(h,{scope:i,baseId:(0,p.useId)(),value:x,onValueChange:v,orientation:s,dir:b,activationMode:f,children:(0,t.jsx)(l.Primitive.div,{dir:b,"data-orientation":s,...g,ref:a})})});x.displayName=m;var v="TabsList",y=i.forwardRef((e,a)=>{let{__scopeTabs:i,loop:o=!0,...r}=e,s=b(v,i),d=g(i);return(0,t.jsx)(n.Root,{asChild:!0,...d,orientation:s.orientation,dir:s.dir,loop:o,children:(0,t.jsx)(l.Primitive.div,{role:"tablist","aria-orientation":s.orientation,...r,ref:a})})});y.displayName=v;var w="TabsTrigger",$=i.forwardRef((e,a)=>{let{__scopeTabs:i,value:r,disabled:s=!1,...d}=e,c=b(w,i),p=g(i),m=N(c.baseId,r),u=S(c.baseId,r),f=r===c.value;return(0,t.jsx)(n.Item,{asChild:!0,...p,focusable:!s,active:f,children:(0,t.jsx)(l.Primitive.button,{type:"button",role:"tab","aria-selected":f,"aria-controls":u,"data-state":f?"active":"inactive","data-disabled":s?"":void 0,disabled:s,id:m,...d,ref:a,onMouseDown:(0,o.composeEventHandlers)(e.onMouseDown,e=>{s||0!==e.button||!1!==e.ctrlKey?e.preventDefault():c.onValueChange(r)}),onKeyDown:(0,o.composeEventHandlers)(e.onKeyDown,e=>{[" ","Enter"].includes(e.key)&&c.onValueChange(r)}),onFocus:(0,o.composeEventHandlers)(e.onFocus,()=>{let e="manual"!==c.activationMode;f||s||!e||c.onValueChange(r)})})})});$.displayName=w;var j="TabsContent",C=i.forwardRef((e,a)=>{let{__scopeTabs:o,value:r,forceMount:n,children:d,...c}=e,p=b(j,o),m=N(p.baseId,r),u=S(p.baseId,r),f=r===p.value,g=i.useRef(f);return i.useEffect(()=>{let e=requestAnimationFrame(()=>g.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,t.jsx)(s.Presence,{present:n||f,children:({present:i})=>(0,t.jsx)(l.Primitive.div,{"data-state":f?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":m,hidden:!i,id:u,tabIndex:0,...c,ref:a,style:{...e.style,animationDuration:g.current?"0s":void 0},children:i&&d})})});function N(e,t){return`${e}-trigger-${t}`}function S(e,t){return`${e}-content-${t}`}C.displayName=j,e.s(["Content",0,C,"List",0,y,"Root",0,x,"Tabs",0,x,"TabsContent",0,C,"TabsList",0,y,"TabsTrigger",0,$,"Trigger",0,$,"createTabsScope",0,f],926209);var k=e.i(926209),k=k,R=e.i(718938);let T=(0,a.cva)("group/tabs-list inline-flex w-fit items-center justify-center rounded-4xl p-[3px] text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl data-[variant=line]:rounded-none",{variants:{variant:{default:"bg-muted",line:"gap-1 bg-transparent group-data-horizontal/tabs:h-auto group-data-horizontal/tabs:min-h-0"}},defaultVariants:{variant:"default"}});e.s(["Tabs",0,function({className:e,orientation:a="horizontal",...i}){return(0,t.jsx)(k.Root,{"data-slot":"tabs","data-orientation":a,className:(0,R.cn)("group/tabs flex gap-2 data-horizontal:flex-col",e),...i})},"TabsContent",0,function({className:e,...a}){return(0,t.jsx)(k.Content,{"data-slot":"tabs-content",className:(0,R.cn)("flex-1 text-sm outline-none",e),...a})},"TabsList",0,function({className:e,variant:a="default",...i}){return(0,t.jsx)(k.List,{"data-slot":"tabs-list","data-variant":a,className:(0,R.cn)(T({variant:a}),e),...i})},"TabsTrigger",0,function({className:e,...a}){return(0,t.jsx)(k.Trigger,{"data-slot":"tabs-trigger",className:(0,R.cn)("relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:px-2.5 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4","group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent","data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground","after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",e),...a})}],533637)},17992,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(30030),o=e.i(75830),r=e.i(820783),n=e.i(981140),s=e.i(369340),l=e.i(248425),d=e.i(934620),c=e.i(296626),p=e.i(610772),m="Collapsible",[u,f]=(0,i.createContextScope)(m),[g,h]=u(m),b=a.forwardRef((e,i)=>{let{__scopeCollapsible:o,open:r,defaultOpen:n,disabled:d,onOpenChange:c,...u}=e,[f,h]=(0,s.useControllableState)({prop:r,defaultProp:n??!1,onChange:c,caller:m});return(0,t.jsx)(g,{scope:o,disabled:d,contentId:(0,p.useId)(),open:f,onOpenToggle:a.useCallback(()=>h(e=>!e),[h]),children:(0,t.jsx)(l.Primitive.div,{"data-state":j(f),"data-disabled":d?"":void 0,...u,ref:i})})});b.displayName=m;var x="CollapsibleTrigger",v=a.forwardRef((e,a)=>{let{__scopeCollapsible:i,...o}=e,r=h(x,i);return(0,t.jsx)(l.Primitive.button,{type:"button","aria-controls":r.contentId,"aria-expanded":r.open||!1,"data-state":j(r.open),"data-disabled":r.disabled?"":void 0,disabled:r.disabled,...o,ref:a,onClick:(0,n.composeEventHandlers)(e.onClick,r.onOpenToggle)})});v.displayName=x;var y="CollapsibleContent",w=a.forwardRef((e,a)=>{let{forceMount:i,...o}=e,r=h(y,e.__scopeCollapsible);return(0,t.jsx)(c.Presence,{present:i||r.open,children:({present:e})=>(0,t.jsx)($,{...o,ref:a,present:e})})});w.displayName=y;var $=a.forwardRef((e,i)=>{let{__scopeCollapsible:o,present:n,children:s,...c}=e,p=h(y,o),[m,u]=a.useState(n),f=a.useRef(null),g=(0,r.useComposedRefs)(i,f),b=a.useRef(0),x=b.current,v=a.useRef(0),w=v.current,$=p.open||m,C=a.useRef($),N=a.useRef(void 0);return a.useEffect(()=>{let e=requestAnimationFrame(()=>C.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,d.useLayoutEffect)(()=>{let e=f.current;if(e){N.current=N.current||{transitionDuration:e.style.transitionDuration,animationName:e.style.animationName},e.style.transitionDuration="0s",e.style.animationName="none";let t=e.getBoundingClientRect();b.current=t.height,v.current=t.width,C.current||(e.style.transitionDuration=N.current.transitionDuration,e.style.animationName=N.current.animationName),u(n)}},[p.open,n]),(0,t.jsx)(l.Primitive.div,{"data-state":j(p.open),"data-disabled":p.disabled?"":void 0,id:p.contentId,hidden:!$,...c,ref:g,style:{"--radix-collapsible-content-height":x?`${x}px`:void 0,"--radix-collapsible-content-width":w?`${w}px`:void 0,...e.style},children:$&&s})});function j(e){return e?"open":"closed"}var C=e.i(586318),N="Accordion",S=["Home","End","ArrowDown","ArrowUp","ArrowLeft","ArrowRight"],[k,R,T]=(0,o.createCollection)(N),[z,A]=(0,i.createContextScope)(N,[T,f]),D=f(),I=a.default.forwardRef((e,a)=>{let{type:i,...o}=e;return(0,t.jsx)(k.Provider,{scope:e.__scopeAccordion,children:"multiple"===i?(0,t.jsx)(F,{...o,ref:a}):(0,t.jsx)(H,{...o,ref:a})})});I.displayName=N;var[L,P]=z(N),[E,O]=z(N,{collapsible:!1}),H=a.default.forwardRef((e,i)=>{let{value:o,defaultValue:r,onValueChange:n=()=>{},collapsible:l=!1,...d}=e,[c,p]=(0,s.useControllableState)({prop:o,defaultProp:r??"",onChange:n,caller:N});return(0,t.jsx)(L,{scope:e.__scopeAccordion,value:a.default.useMemo(()=>c?[c]:[],[c]),onItemOpen:p,onItemClose:a.default.useCallback(()=>l&&p(""),[l,p]),children:(0,t.jsx)(E,{scope:e.__scopeAccordion,collapsible:l,children:(0,t.jsx)(U,{...d,ref:i})})})}),F=a.default.forwardRef((e,i)=>{let{value:o,defaultValue:r,onValueChange:n=()=>{},...l}=e,[d,c]=(0,s.useControllableState)({prop:o,defaultProp:r??[],onChange:n,caller:N}),p=a.default.useCallback(e=>c((t=[])=>[...t,e]),[c]),m=a.default.useCallback(e=>c((t=[])=>t.filter(t=>t!==e)),[c]);return(0,t.jsx)(L,{scope:e.__scopeAccordion,value:d,onItemOpen:p,onItemClose:m,children:(0,t.jsx)(E,{scope:e.__scopeAccordion,collapsible:!0,children:(0,t.jsx)(U,{...l,ref:i})})})}),[M,_]=z(N),U=a.default.forwardRef((e,i)=>{let{__scopeAccordion:o,disabled:s,dir:d,orientation:c="vertical",...p}=e,m=a.default.useRef(null),u=(0,r.useComposedRefs)(m,i),f=R(o),g="ltr"===(0,C.useDirection)(d),h=(0,n.composeEventHandlers)(e.onKeyDown,e=>{if(!S.includes(e.key))return;let t=e.target,a=f().filter(e=>!e.ref.current?.disabled),i=a.findIndex(e=>e.ref.current===t),o=a.length;if(-1===i)return;e.preventDefault();let r=i,n=o-1,s=()=>{(r=i+1)>n&&(r=0)},l=()=>{(r=i-1)<0&&(r=n)};switch(e.key){case"Home":r=0;break;case"End":r=n;break;case"ArrowRight":"horizontal"===c&&(g?s():l());break;case"ArrowDown":"vertical"===c&&s();break;case"ArrowLeft":"horizontal"===c&&(g?l():s());break;case"ArrowUp":"vertical"===c&&l()}let d=r%o;a[d].ref.current?.focus()});return(0,t.jsx)(M,{scope:o,disabled:s,direction:d,orientation:c,children:(0,t.jsx)(k.Slot,{scope:o,children:(0,t.jsx)(l.Primitive.div,{...p,"data-orientation":c,ref:u,onKeyDown:s?void 0:h})})})}),q="AccordionItem",[B,V]=z(q),W=a.default.forwardRef((e,a)=>{let{__scopeAccordion:i,value:o,...r}=e,n=_(q,i),s=P(q,i),l=D(i),d=(0,p.useId)(),c=o&&s.value.includes(o)||!1,m=n.disabled||e.disabled;return(0,t.jsx)(B,{scope:i,open:c,disabled:m,triggerId:d,children:(0,t.jsx)(b,{"data-orientation":n.orientation,"data-state":Z(c),...l,...r,ref:a,disabled:m,open:c,onOpenChange:e=>{e?s.onItemOpen(o):s.onItemClose(o)}})})});W.displayName=q;var K="AccordionHeader",Y=a.default.forwardRef((e,a)=>{let{__scopeAccordion:i,...o}=e,r=_(N,i),n=V(K,i);return(0,t.jsx)(l.Primitive.h3,{"data-orientation":r.orientation,"data-state":Z(n.open),"data-disabled":n.disabled?"":void 0,...o,ref:a})});Y.displayName=K;var J="AccordionTrigger",G=a.default.forwardRef((e,a)=>{let{__scopeAccordion:i,...o}=e,r=_(N,i),n=V(J,i),s=O(J,i),l=D(i);return(0,t.jsx)(k.ItemSlot,{scope:i,children:(0,t.jsx)(v,{"aria-disabled":n.open&&!s.collapsible||void 0,"data-orientation":r.orientation,id:n.triggerId,...l,...o,ref:a})})});G.displayName=J;var X="AccordionContent",Q=a.default.forwardRef((e,a)=>{let{__scopeAccordion:i,...o}=e,r=_(N,i),n=V(X,i),s=D(i);return(0,t.jsx)(w,{role:"region","aria-labelledby":n.triggerId,"data-orientation":r.orientation,...s,...o,ref:a,style:{"--radix-accordion-content-height":"var(--radix-collapsible-content-height)","--radix-accordion-content-width":"var(--radix-collapsible-content-width)",...e.style}})});function Z(e){return e?"open":"closed"}Q.displayName=X,e.s(["Accordion",0,I,"AccordionContent",0,Q,"AccordionHeader",0,Y,"AccordionItem",0,W,"AccordionTrigger",0,G,"Content",0,Q,"Header",0,Y,"Item",0,W,"Root",0,I,"Trigger",0,G,"createAccordionScope",0,A],767660);var ee=e.i(767660),ee=ee,et=e.i(718938);e.i(197379);var ea=e.i(472804),ei=e.i(568275);e.s(["Accordion",0,function({className:e,...a}){return(0,t.jsx)(ee.Root,{"data-slot":"accordion",className:(0,et.cn)("flex w-full flex-col overflow-hidden",e),...a})},"AccordionContent",0,function({className:e,children:a,...i}){return(0,t.jsx)(ee.Content,{"data-slot":"accordion-content",className:"overflow-hidden px-4 text-sm data-open:animate-accordion-down data-closed:animate-accordion-up",...i,children:(0,t.jsx)("div",{className:(0,et.cn)("h-(--radix-accordion-content-height) pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",e),children:a})})},"AccordionItem",0,function({className:e,...a}){return(0,t.jsx)(ee.Item,{"data-slot":"accordion-item",className:(0,et.cn)("not-last:border-b data-open:bg-muted/50",e),...a})},"AccordionTrigger",0,function({className:e,children:a,...i}){return(0,t.jsx)(ee.Header,{className:"flex",children:(0,t.jsxs)(ee.Trigger,{"data-slot":"accordion-trigger",className:(0,et.cn)("group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",e),...i,children:[a,(0,t.jsx)(ea.HugeiconsIcon,{icon:ei.ArrowDown01Icon,strokeWidth:2,"data-slot":"accordion-trigger-icon",className:"pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"}),(0,t.jsx)(ea.HugeiconsIcon,{icon:ei.ArrowUp01Icon,strokeWidth:2,"data-slot":"accordion-trigger-icon",className:"pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"})]})})}],17992)}]);