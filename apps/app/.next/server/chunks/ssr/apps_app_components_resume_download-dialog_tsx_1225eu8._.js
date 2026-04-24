module.exports=[799732,a=>{"use strict";var b=a.i(187924),c=a.i(572131),d=a.i(50944),e=a.i(769673),f=a.i(333033),g=a.i(114217),h=a.i(953784),i=a.i(841427),j=a.i(729132),k=a.i(896628);async function l({data:a,template:b,fileName:c,designOptions:d,customColor:e}){let f=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(f||(f=document.querySelector("[data-resume-preview]")),!f)throw Error("Resume preview element not found. Please ensure the resume is rendered on the page.");let g=f.cloneNode(!0);!function(a,b){let c=[a,...Array.from(a.querySelectorAll("*"))],d=[b,...Array.from(b.querySelectorAll("*"))],e=Math.min(c.length,d.length);for(let a=0;a<e;a++){let b=c[a],e=d[a];if(!(e instanceof HTMLElement))continue;let f=window.getComputedStyle(b),g=Array.from(f).map(a=>`${a}:${f.getPropertyValue(a)};`).join("");e.style.cssText=g}}(f,g),g.querySelectorAll("img").forEach(a=>{let b=a.getAttribute("src");if(b)try{let c=new URL(b,window.location.origin).toString();a.setAttribute("src",c)}catch{}});let h=window.getComputedStyle(f).backgroundColor||"#ffffff";g.querySelectorAll("button, input, select, textarea, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]").forEach(a=>{a.remove()});let i=Array.from(document.querySelectorAll('head link[rel="preconnect"], head link[rel="stylesheet"]')).filter(a=>{let b=a.getAttribute("href")||"";return b.includes("fonts.googleapis.com")||b.includes("fonts.gstatic.com")}).map(a=>a.outerHTML).join("\n"),j=`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${window.location.origin}/" />
    ${i}
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: ${h};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      [data-resume-preview] {
        width: 210mm !important;
        max-width: 210mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: ${h} !important;
      }
    </style>
  </head>
  <body>
    ${g.outerHTML}
  </body>
</html>
  `.trim(),k=await fetch("/api/resume/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:j,fileName:c})});if(!k.ok){let a=await k.text();throw Error(`Failed to generate PDF: ${a}`)}let m=await k.blob(),n=URL.createObjectURL(m),o=document.createElement("a");o.href=n,o.download=`${c}.pdf`,document.body.appendChild(o),o.click(),o.remove(),URL.revokeObjectURL(n)}let m={fontFamily:"Inter, sans-serif",fontSize:11,lineSpacing:1.6,sectionSpacing:20,paragraphSpacing:12};function n(a,b){return`
    <div class="section">
      <div class="section-title">Education</div>
      ${a.map(a=>b?`
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${a.schoolName}</span>
                <span class="entry-date">${a.startDate} - ${a.endDate}</span>
              </div>
              <div class="entry-position">${a.degree}</div>
              ${a.location?`<div class="entry-subtitle">${a.location}</div>`:""}
              ${a.description?`<div class="entry-description">${a.description}</div>`:""}
            </div>
          `:`
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">${a.degree}</span>
                <span class="entry-date">${a.startDate} - ${a.endDate}</span>
              </div>
              <div class="entry-subtitle">${a.schoolName}${a.location?`, ${a.location}`:""}</div>
              ${a.description?`<div class="entry-description">${a.description}</div>`:""}
            </div>
          `).join("")}
    </div>
  `}let o=["display","position","top","right","bottom","left","float","clear","width","height","max-width","max-height","min-width","min-height","margin","margin-top","margin-right","margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom","padding-left","border","border-top","border-right","border-bottom","border-left","border-radius","box-sizing","background","background-color","color","font","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-transform","text-decoration","white-space","word-break","overflow","overflow-x","overflow-y","flex","flex-direction","flex-wrap","justify-content","align-items","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","opacity"];async function p({data:a,template:b,fileName:c,designOptions:d,customColor:e}){let f,g=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(g){var h;let a,b,c=g.cloneNode(!0);c.style.width="210mm",c.style.maxWidth="210mm",c.style.minHeight="auto",c.style.margin="0 auto",c.style.backgroundColor="#ffffff",c.style.borderRadius="0",c.style.boxShadow="none",c.style.overflow="visible",c.style.height="auto";let d=c.querySelector("[data-resume-content]");d&&(d.style.overflow="visible",d.style.height="auto",d.style.maxHeight="none"),a=[g,...Array.from(g.querySelectorAll("*"))],b=[c,...Array.from(c.querySelectorAll("*"))],a.forEach((a,c)=>{let d=b[c];if(!(a instanceof HTMLElement)||!d)return;let e=window.getComputedStyle(a),f=o.map(a=>`${a}:${e.getPropertyValue(a)};`).join("");d.setAttribute("style",f)}),c.querySelectorAll("[data-preview-header], [data-preview-footer], [data-page-break-indicator], button, input, select").forEach(a=>{a.remove()}),h=c.outerHTML,f=`
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
    <body>${h}</body>
    </html>
  `}else f=function({data:a,template:b,designOptions:c}){var d,e,f,g,h,i,j,k,l,m,o,p;let q=b.layout||"classic",r="harvard"===q,s=`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: ${c.fontFamily}; 
        font-size: ${c.fontSize}pt; 
        line-height: ${c.lineSpacing};
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .title { font-size: 12pt; color: #666; margin-top: 5px; }
      .contact-info { font-size: 10pt; color: #666; margin-top: 10px; }
      .section { margin-bottom: ${c.sectionSpacing}px; page-break-inside: avoid; }
      .entry { margin-bottom: ${c.paragraphSpacing}px; page-break-inside: avoid; }
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
  <style>${function(a,b,c){switch(a){case"harvard":return`
        .header { text-align: center; margin-bottom: ${c.sectionSpacing}px; border-bottom: 1px solid #1e1e1e; padding-bottom: 15px; }
        .name { font-size: 22pt; font-weight: bold; color: #1e1e1e; text-transform: uppercase; letter-spacing: 1px; }
        .section-title { 
          font-size: 11pt; 
          font-weight: bold; 
          color: #1e1e1e; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          border-bottom: 1px solid #1e1e1e; 
          padding-bottom: 3px; 
          margin-bottom: ${c.paragraphSpacing}px; 
        }
        .entry-title { font-weight: bold; color: #1e1e1e; }
        .entry-position { font-style: italic; }
      `;case"modern":return`
        .header { text-align: left; margin-bottom: ${c.sectionSpacing}px; border-bottom: 3px solid ${b}; padding-bottom: 15px; }
        .name { font-size: 26pt; font-weight: bold; color: ${b}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${b}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${b}; 
          padding-bottom: 5px; 
          margin-bottom: ${c.paragraphSpacing}px; 
        }
      `;case"bold":return`
        .header { background: ${b}; color: white; padding: 30px; margin: -40px -40px 20px -40px; }
        .name { font-size: 28pt; font-weight: bold; color: white; text-transform: uppercase; }
        .title { color: rgba(255,255,255,0.8); }
        .contact-info { color: rgba(255,255,255,0.7); }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: white; 
          text-transform: uppercase; 
          background: ${b};
          padding: 5px 10px;
          margin-bottom: ${c.paragraphSpacing}px; 
        }
        .entry { border-left: 4px solid ${b}; padding-left: 15px; }
      `;case"minimal":return`
        .header { text-align: center; margin-bottom: ${c.sectionSpacing}px; }
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
          margin-bottom: ${c.paragraphSpacing}px; 
        }
      `;case"executive":return`
        .header { margin-bottom: ${c.sectionSpacing}px; border-bottom: 2px solid ${b}; padding-bottom: 15px; }
        .name { font-size: 28pt; font-weight: bold; color: ${b}; }
        .summary { border-left: 4px solid ${b}; padding-left: 15px; font-style: italic; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${b}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${b}; 
          padding-bottom: 5px; 
          margin-bottom: ${c.paragraphSpacing}px; 
        }
      `;case"sidebar":return`
        .header { text-align: center; margin-bottom: ${c.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: bold; color: ${b}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${b}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${b}; 
          padding-bottom: 5px; 
          margin-bottom: ${c.paragraphSpacing}px; 
        }
      `;default:return`
        .header { text-align: center; margin-bottom: ${c.sectionSpacing}px; border-top: 4px solid ${b}; padding-top: 20px; }
        .name { font-size: 24pt; font-weight: bold; color: ${b}; text-transform: uppercase; letter-spacing: 2px; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${b}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${b}; 
          padding-bottom: 5px; 
          margin-bottom: ${c.paragraphSpacing}px; 
        }
      `}}(q,b.primaryColor,c)}</style>`;return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${a.contact.firstName} ${a.contact.lastName} - Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      ${s}
    </head>
    <body>
      ${d=a,`
    <div class="header">
      <div class="name">${d.contact.firstName||"Your"} ${d.contact.lastName||"Name"}</div>
      ${d.contact.desiredJobTitle?`<div class="title">${d.contact.desiredJobTitle}</div>`:""}
      <div class="contact-info">
        ${[d.contact.email,d.contact.phone].filter(Boolean).join(" | ")}
      </div>
    </div>
  `}
      ${!r&&a.summary?(e=a.summary,`
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${e}</div>
    </div>
  `):""}
      ${r&&a.educations.length>0?n(a.educations,r):""}
      ${a.experiences.length>0?(f=a.experiences,g=r,`
    <div class="section">
      <div class="section-title">Experience</div>
      ${f.map(a=>`
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${g?a.employer:a.jobTitle}${!g&&a.employer?`, ${a.employer}`:""}</span>
            <span class="entry-date">${a.startDate} - ${a.isCurrentJob?"Present":a.endDate}</span>
          </div>
          ${g?`<div class="entry-position">${a.jobTitle}</div>`:""}
          ${a.location?`<div class="entry-subtitle">${a.location}</div>`:""}
          ${a.description?`<div class="entry-description">${a.description}</div>`:""}
        </div>
      `).join("")}
    </div>
  `):""}
      ${!r&&a.educations.length>0?n(a.educations,r):""}
      ${a.skills.length>0?(h=a.skills,i=r,`
    <div class="section">
      <div class="section-title">${i?"Skills & Interests":"Skills"}</div>
      ${i?`
        <div>${h.map(a=>a.name).join(", ")}</div>
      `:`
        <div class="skills-list">
          ${h.map(a=>`
            <span class="skill-tag">${a.name}${a.showLevel?` (${a.level})`:""}</span>
          `).join("")}
        </div>
      `}
    </div>
  `):""}
      ${a.finalize.languages.length>0?(j=a.finalize.languages,`
    <div class="section">
      <div class="section-title">Languages</div>
      <div>${j.map(a=>`${a.name} (${a.proficiency})`).join(", ")}</div>
    </div>
  `):""}
      ${a.finalize.certifications.length>0?(k=a.finalize.certifications,`
    <div class="section">
      <div class="section-title">Certifications</div>
      ${k.map(a=>`<div>${a.name} - ${a.issuer} (${a.date})</div>`).join("")}
    </div>
  `):""}
      ${a.finalize.awards.length>0?(l=a.finalize.awards,`
    <div class="section">
      <div class="section-title">Awards & Honors</div>
      ${l.map(a=>`<div>${a.title} - ${a.issuer} (${a.date})</div>`).join("")}
    </div>
  `):""}
      ${a.finalize.websites.length>0?(m=a.finalize.websites,`
    <div class="section">
      <div class="section-title">Links</div>
      <div>${m.map(a=>`${a.label}: ${a.url}`).join(" | ")}</div>
    </div>
  `):""}
      ${a.finalize.references.length>0?(o=a.finalize.references,`
    <div class="section">
      <div class="section-title">References</div>
      ${o.map(a=>`
        <div class="entry">
          <div class="entry-title">${a.name}</div>
          <div class="entry-subtitle">${a.position}${a.company?`, ${a.company}`:""}</div>
          <div style="font-size: 10pt; color: #666;">${a.email}${a.phone?` | ${a.phone}`:""}</div>
        </div>
      `).join("")}
    </div>
  `):""}
      ${a.finalize.hobbies.length>0?(p=a.finalize.hobbies,`
    <div class="section">
      <div class="section-title">Hobbies & Interests</div>
      <div>${p.map(a=>a.name).join(", ")}</div>
    </div>
  `):""}
      ${a.finalize.customSections.map(a=>{var b;return b=a,`
    <div class="section">
      <div class="section-title">${b.sectionName}</div>
      <div>${b.description}</div>
    </div>
  `}).join("")}
    </body>
    </html>
  `}({data:a,template:{primaryColor:e||b.primaryColor,layout:b.layout||"classic"},designOptions:d});let i=new Blob([f],{type:"application/msword"}),j=URL.createObjectURL(i),k=document.createElement("a");k.href=j,k.download=`${c}.doc`,document.body.appendChild(k),k.click(),document.body.removeChild(k),URL.revokeObjectURL(j)}a.s(["DownloadDialog",0,function({data:a,isOpen:n,onClose:o,designOptions:q=m,customFileName:r,customColor:s,showPhoto:t=!1,onDownloadComplete:u}){let v=(0,d.useRouter)(),[w,x]=(0,c.useState)("pdf"),[y,z]=(0,c.useState)(!1),[A,B]=(0,c.useState)(!1),C=i.resumeTemplates.find(b=>b.id===a.templateId)||i.resumeTemplates[0],D=r||`${a.contact.firstName||"Resume"}_${a.contact.lastName||"CV"}`,E=async()=>{if(A)return void v.push("/dashboard");z(!0);try{"pdf"===w?(await new Promise(a=>setTimeout(a,100)),await l({data:a,template:C,fileName:D,designOptions:q,customColor:s})):await p({data:a,template:C,fileName:D,designOptions:q,customColor:s}),B(!0),u&&u()}catch(a){console.error("Download failed:",a),alert("Failed to generate resume. Please try again.")}finally{z(!1)}};return((0,c.useEffect)(()=>{n&&setTimeout(()=>{let a=document.querySelector("[data-resume-export-preview] [data-resume-preview]");a&&a.getBoundingClientRect()},50)},[n]),n)?(0,b.jsxs)(b.Fragment,{children:[n&&(0,b.jsx)("div",{"data-resume-export-preview":!0,style:{position:"fixed",left:"-10000px",top:0,width:"210mm",height:"auto",overflow:"visible",visibility:"visible"},children:(0,b.jsx)(j.ResumePreview,{data:a,designOptions:q,customColor:s,showPhoto:t,showScore:!1,showFooter:!1,plain:!0,renderAllPages:!0})}),(0,b.jsx)(h.Dialog,{open:n,onOpenChange:o,children:(0,b.jsxs)(h.DialogContent,{className:"sm:max-w-md",children:[(0,b.jsxs)(h.DialogHeader,{children:[(0,b.jsx)("div",{className:"flex justify-center mb-4",children:(0,b.jsx)("div",{className:"inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10",children:(0,b.jsx)(k.Download,{className:"h-6 w-6 text-primary"})})}),(0,b.jsx)(h.DialogTitle,{className:"text-center",children:"Download Your Resume"}),(0,b.jsx)(h.DialogDescription,{className:"text-center",children:"Choose your preferred format"})]}),(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsx)(f.Label,{className:"text-sm font-medium",children:"Select Format"}),(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,b.jsxs)("button",{onClick:()=>x("pdf"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"pdf"===w?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,b.jsx)(k.FileText,{className:`h-8 w-8 ${"pdf"===w?"text-primary":"text-muted-foreground"}`}),(0,b.jsx)("span",{className:"font-medium",children:"PDF"}),(0,b.jsx)("span",{className:"text-xs text-muted-foreground",children:"Best for sharing"})]}),(0,b.jsxs)("button",{onClick:()=>x("docx"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"docx"===w?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,b.jsx)(k.File,{className:`h-8 w-8 ${"docx"===w?"text-primary":"text-muted-foreground"}`}),(0,b.jsx)("span",{className:"font-medium",children:"DOCX"}),(0,b.jsx)("span",{className:"text-xs text-muted-foreground",children:"Easy to edit"})]})]}),(0,b.jsxs)("div",{className:"bg-muted/50 rounded-lg p-3 text-sm",children:[(0,b.jsxs)("p",{className:"font-medium mb-1",children:["File: ",D,".",w]}),(0,b.jsxs)("p",{className:"text-muted-foreground text-xs",children:["Template: ",C.name]})]}),(0,b.jsxs)("div",{className:"flex gap-3 pt-2",children:[(0,b.jsx)(e.Button,{variant:"outline",onClick:o,className:"flex-1",children:"Cancel"}),(0,b.jsx)(e.Button,{onClick:E,disabled:y,className:"flex-1",children:y?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(g.Spinner,{className:"mr-2 h-4 w-4"}),"Downloading..."]}):A?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(k.ArrowRight,{className:"mr-2 h-4 w-4"}),"Go To Dashboard"]}):(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(k.Download,{className:"mr-2 h-4 w-4"}),"Download ",w.toUpperCase()]})})]})]})]})})]}):null}],799732)}];

//# sourceMappingURL=apps_app_components_resume_download-dialog_tsx_1225eu8._.js.map