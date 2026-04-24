(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,635804,e=>{"use strict";var t=e.i(271645),i=e.i(934620);e.s(["useSize",0,function(e){let[a,r]=t.useState(void 0);return(0,i.useLayoutEffect)(()=>{if(e){r({width:e.offsetWidth,height:e.offsetHeight});let t=new ResizeObserver(t=>{let i,a;if(!Array.isArray(t)||!t.length)return;let o=t[0];if("borderBoxSize"in o){let e=o.borderBoxSize,t=Array.isArray(e)?e[0]:e;i=t.inlineSize,a=t.blockSize}else i=e.offsetWidth,a=e.offsetHeight;r({width:i,height:a})});return t.observe(e,{box:"border-box"}),()=>t.unobserve(e)}r(void 0)},[e]),a}])},75830,e=>{"use strict";var t=e.i(271645),i=e.i(30030),a=e.i(820783),r=e.i(843476);function o(e){var i;let o,n=(i=e,(o=t.forwardRef((e,i)=>{let{children:r,...o}=e;if(t.isValidElement(r)){var n;let e,s,l=(n=r,(s=(e=Object.getOwnPropertyDescriptor(n.props,"ref")?.get)&&"isReactWarning"in e&&e.isReactWarning)?n.ref:(s=(e=Object.getOwnPropertyDescriptor(n,"ref")?.get)&&"isReactWarning"in e&&e.isReactWarning)?n.props.ref:n.props.ref||n.ref),d=function(e,t){let i={...t};for(let a in t){let r=e[a],o=t[a];/^on[A-Z]/.test(a)?r&&o?i[a]=(...e)=>{let t=o(...e);return r(...e),t}:r&&(i[a]=r):"style"===a?i[a]={...r,...o}:"className"===a&&(i[a]=[r,o].filter(Boolean).join(" "))}return{...e,...i}}(o,r.props);return r.type!==t.Fragment&&(d.ref=i?(0,a.composeRefs)(i,l):l),t.cloneElement(r,d)}return t.Children.count(r)>1?t.Children.only(null):null})).displayName=`${i}.SlotClone`,o),l=t.forwardRef((e,i)=>{let{children:a,...o}=e,l=t.Children.toArray(a),d=l.find(s);if(d){let e=d.props.children,a=l.map(i=>i!==d?i:t.Children.count(e)>1?t.Children.only(null):t.isValidElement(e)?e.props.children:null);return(0,r.jsx)(n,{...o,ref:i,children:t.isValidElement(e)?t.cloneElement(e,void 0,a):null})}return(0,r.jsx)(n,{...o,ref:i,children:a})});return l.displayName=`${e}.Slot`,l}var n=Symbol("radix.slottable");function s(e){return t.isValidElement(e)&&"function"==typeof e.type&&"__radixId"in e.type&&e.type.__radixId===n}var l=new WeakMap;function d(e,t){var i,a;let r,o,n;if("at"in Array.prototype)return Array.prototype.at.call(e,t);let s=(i=e,a=t,r=i.length,(n=(o=c(a))>=0?o:r+o)<0||n>=r?-1:n);return -1===s?void 0:e[s]}function c(e){return e!=e||0===e?0:Math.trunc(e)}(class e extends Map{#e;constructor(e){super(e),this.#e=[...super.keys()],l.set(this,!0)}set(e,t){return l.get(this)&&(this.has(e)?this.#e[this.#e.indexOf(e)]=e:this.#e.push(e)),super.set(e,t),this}insert(e,t,i){let a,r=this.has(t),o=this.#e.length,n=c(e),s=n>=0?n:o+n,l=s<0||s>=o?-1:s;if(l===this.size||r&&l===this.size-1||-1===l)return this.set(t,i),this;let d=this.size+ +!r;n<0&&s++;let p=[...this.#e],m=!1;for(let e=s;e<d;e++)if(s===e){let o=p[e];p[e]===t&&(o=p[e+1]),r&&this.delete(t),a=this.get(o),this.set(t,i)}else{m||p[e-1]!==t||(m=!0);let i=p[m?e:e-1],r=a;a=this.get(i),this.delete(i),this.set(i,r)}return this}with(t,i,a){let r=new e(this);return r.insert(t,i,a),r}before(e){let t=this.#e.indexOf(e)-1;if(!(t<0))return this.entryAt(t)}setBefore(e,t,i){let a=this.#e.indexOf(e);return -1===a?this:this.insert(a,t,i)}after(e){let t=this.#e.indexOf(e);if(-1!==(t=-1===t||t===this.size-1?-1:t+1))return this.entryAt(t)}setAfter(e,t,i){let a=this.#e.indexOf(e);return -1===a?this:this.insert(a+1,t,i)}first(){return this.entryAt(0)}last(){return this.entryAt(-1)}clear(){return this.#e=[],super.clear()}delete(e){let t=super.delete(e);return t&&this.#e.splice(this.#e.indexOf(e),1),t}deleteAt(e){let t=this.keyAt(e);return void 0!==t&&this.delete(t)}at(e){let t=d(this.#e,e);if(void 0!==t)return this.get(t)}entryAt(e){let t=d(this.#e,e);if(void 0!==t)return[t,this.get(t)]}indexOf(e){return this.#e.indexOf(e)}keyAt(e){return d(this.#e,e)}from(e,t){let i=this.indexOf(e);if(-1===i)return;let a=i+t;return a<0&&(a=0),a>=this.size&&(a=this.size-1),this.at(a)}keyFrom(e,t){let i=this.indexOf(e);if(-1===i)return;let a=i+t;return a<0&&(a=0),a>=this.size&&(a=this.size-1),this.keyAt(a)}find(e,t){let i=0;for(let a of this){if(Reflect.apply(e,t,[a,i,this]))return a;i++}}findIndex(e,t){let i=0;for(let a of this){if(Reflect.apply(e,t,[a,i,this]))return i;i++}return -1}filter(t,i){let a=[],r=0;for(let e of this)Reflect.apply(t,i,[e,r,this])&&a.push(e),r++;return new e(a)}map(t,i){let a=[],r=0;for(let e of this)a.push([e[0],Reflect.apply(t,i,[e,r,this])]),r++;return new e(a)}reduce(...e){let[t,i]=e,a=0,r=i??this.at(0);for(let i of this)r=0===a&&1===e.length?i:Reflect.apply(t,this,[r,i,a,this]),a++;return r}reduceRight(...e){let[t,i]=e,a=i??this.at(-1);for(let i=this.size-1;i>=0;i--){let r=this.at(i);a=i===this.size-1&&1===e.length?r:Reflect.apply(t,this,[a,r,i,this])}return a}toSorted(t){return new e([...this.entries()].sort(t))}toReversed(){let t=new e;for(let e=this.size-1;e>=0;e--){let i=this.keyAt(e),a=this.get(i);t.set(i,a)}return t}toSpliced(...t){let i=[...this.entries()];return i.splice(...t),new e(i)}slice(t,i){let a=new e,r=this.size-1;if(void 0===t)return a;t<0&&(t+=this.size),void 0!==i&&i>0&&(r=i-1);for(let e=t;e<=r;e++){let t=this.keyAt(e),i=this.get(t);a.set(t,i)}return a}every(e,t){let i=0;for(let a of this){if(!Reflect.apply(e,t,[a,i,this]))return!1;i++}return!0}some(e,t){let i=0;for(let a of this){if(Reflect.apply(e,t,[a,i,this]))return!0;i++}return!1}}),e.s(["createCollection",0,function(e){let n=e+"CollectionProvider",[s,l]=(0,i.createContextScope)(n),[d,c]=s(n,{collectionRef:{current:null},itemMap:new Map}),p=e=>{let{scope:i,children:a}=e,o=t.default.useRef(null),n=t.default.useRef(new Map).current;return(0,r.jsx)(d,{scope:i,itemMap:n,collectionRef:o,children:a})};p.displayName=n;let m=e+"CollectionSlot",u=o(m),f=t.default.forwardRef((e,t)=>{let{scope:i,children:o}=e,n=c(m,i),s=(0,a.useComposedRefs)(t,n.collectionRef);return(0,r.jsx)(u,{ref:s,children:o})});f.displayName=m;let h=e+"CollectionItemSlot",g="data-radix-collection-item",y=o(h),b=t.default.forwardRef((e,i)=>{let{scope:o,children:n,...s}=e,l=t.default.useRef(null),d=(0,a.useComposedRefs)(i,l),p=c(h,o);return t.default.useEffect(()=>(p.itemMap.set(l,{ref:l,...s}),()=>void p.itemMap.delete(l))),(0,r.jsx)(y,{...{[g]:""},ref:d,children:n})});return b.displayName=h,[{Provider:p,Slot:f,ItemSlot:b},function(i){let a=c(e+"CollectionConsumer",i);return t.default.useCallback(()=>{let e=a.collectionRef.current;if(!e)return[];let t=Array.from(e.querySelectorAll(`[${g}]`));return Array.from(a.itemMap.values()).sort((e,i)=>t.indexOf(e.ref.current)-t.indexOf(i.ref.current))},[a.collectionRef,a.itemMap])},l]}],75830)},586318,e=>{"use strict";var t=e.i(271645);e.i(843476);var i=t.createContext(void 0);e.s(["useDirection",0,function(e){let a=t.useContext(i);return e||a||"ltr"}])},357136,e=>{"use strict";let t=[{title:"Senior Product Designer",company:"TechCorp Inc.",date:"2021 - Present",location:"San Francisco, CA",description:"Led the design of flagship products, resulting in a 40% increase in user engagement. Collaborated with cross-functional teams including engineering, marketing, and product management to deliver innovative solutions. Conducted user research, created wireframes and prototypes, and implemented design systems that improved consistency across platforms."},{title:"UI/UX Designer",company:"StartupXYZ",date:"2018 - 2021",location:"San Francisco, CA",description:"Designed user interfaces for mobile and web applications, focusing on usability and accessibility. Conducted user research and usability testing to enhance product usability. Worked closely with developers to ensure pixel-perfect implementation of designs."},{title:"Junior Designer",company:"DesignStudio",date:"2016 - 2018",location:"Palo Alto, CA",description:"Assisted in creating visual designs for various client projects. Learned industry-standard tools and best practices in user experience design. Contributed to team brainstorming sessions and design critiques."}],i="B.A. in Design",a="Stanford University",r="2014 - 2018",o="Stanford, CA",n="Graduated Magna Cum Laude with a GPA of 3.8. Focused on digital design, user experience, and graphic design. Completed capstone project on mobile app design trends.",s=["Figma","React","User Research","Prototyping","Design Systems","Adobe Creative Suite","Sketch","InVision"],l=[{name:"English",proficiency:"Native"},{name:"Spanish",proficiency:"Conversational"},{name:"French",proficiency:"Basic"}],d=[{name:"Certified Scrum Master",issuer:"Scrum Alliance",date:"2020"},{name:"Google UX Design Certificate",issuer:"Google",date:"2019"},{name:"Adobe Certified Expert in XD",issuer:"Adobe",date:"2018"}],c=[{title:"Design Excellence Award",issuer:"TechCorp Inc.",date:"2022"},{title:"Best UI/UX Design",issuer:"StartupXYZ",date:"2020"},{title:"Student Design Competition Winner",issuer:"Stanford University",date:"2017"}],p=[{label:"Portfolio",url:"https://johnsmith.design"},{label:"LinkedIn",url:"https://linkedin.com/in/johnsmith"},{label:"GitHub",url:"https://github.com/johnsmith"}],m=[{name:"Jane Doe",position:"Product Manager",company:"TechCorp Inc.",email:"jane.doe@techcorp.com",phone:"(555) 987-6543"},{name:"Bob Johnson",position:"CTO",company:"StartupXYZ",email:"bob.johnson@startupxyz.com",phone:"(555) 456-7890"},{name:"Alice Brown",position:"Design Director",company:"DesignStudio",email:"alice.brown@designstudio.com",phone:"(555) 321-0987"}],u=["Photography","Hiking","Reading Science Fiction","Playing Guitar","Cooking"];e.s(["createSampleResumeForTemplate",0,function(e,f=!1){let h="John Smith".split(" ");return{templateId:e,contact:{firstName:h[0]||"John",lastName:h.slice(1).join(" ")||"Smith",desiredJobTitle:"Senior Product Designer",phone:"(555) 123-4567",email:"john.s@email.com",photoUrl:f?"/sample.png":""},experiences:t.map((e,t)=>({id:`sample-exp-${t+1}`,jobTitle:e.title,employer:e.company,location:e.location||"",startDate:e.date.split(" - ")[0]||e.date,endDate:e.date.split(" - ")[1]||"",isCurrentJob:e.date.toLowerCase().includes("present"),description:e.description||""})),educations:[{id:"sample-edu-1",schoolName:a,location:o||"",degree:i,startDate:r.split(" - ")[0]||r,endDate:r.split(" - ")[1]||"",description:n||""}],skills:s.map((e,t)=>({id:`sample-skill-${t+1}`,name:e,level:"Advanced",showLevel:!1})),summary:"Innovative product designer with 8+ years of experience crafting user-centered digital experiences. Passionate about creating intuitive interfaces that solve real-world problems and enhance user satisfaction.",finalize:{languages:(l||[]).map((e,t)=>({id:`sample-lang-${t+1}`,name:e.name,proficiency:e.proficiency})),certifications:(d||[]).map((e,t)=>({id:`sample-cert-${t+1}`,name:e.name,issuer:e.issuer,date:e.date})),awards:(c||[]).map((e,t)=>({id:`sample-award-${t+1}`,title:e.title,issuer:e.issuer,date:e.date})),websites:(p||[]).map((e,t)=>({id:`sample-site-${t+1}`,label:e.label,url:e.url})),references:(m||[]).map((e,t)=>({id:`sample-ref-${t+1}`,name:e.name,position:e.position,company:e.company,email:e.email,phone:e.phone})),hobbies:(u||[]).map((e,t)=>({id:`sample-hobby-${t+1}`,name:e})),customSections:[]}}},"templates",0,[{id:"celestial",name:"Celestial",description:"Soft neutral tones with refined typography for a sophisticated and professional feel.",thumbnail:"/templates/celestial.png",primaryColor:"#1e3a5f",category:["all","professional","ats"],layout:"classic"},{id:"galaxy",name:"Galaxy",description:"A visually striking resume template, perfect for illustrating the breadth and depth of your expertise.",thumbnail:"/templates/galaxy.png",primaryColor:"#2563eb",category:["all","modern"],layout:"modern"},{id:"astral",name:"Astral",description:"Includes a prominent profile image for a personal touch while maintaining professionalism.",thumbnail:"/templates/astral.png",primaryColor:"#57534e",category:["all","professional","creative"],layout:"sidebar"},{id:"nova",name:"Nova",description:"Clean and minimal design optimized for ATS systems with maximum readability.",thumbnail:"/templates/nova.png",primaryColor:"#374151",category:["all","simple","ats"],layout:"minimal"},{id:"orbit",name:"Orbit",description:"Modern layout with creative elements that stand out while remaining professional.",thumbnail:"/templates/orbit.png",primaryColor:"#dc2626",category:["all","modern","creative"],layout:"bold"},{id:"stellar",name:"Stellar",description:"Bold typography and structured sections for maximum impact and clarity.",thumbnail:"/templates/stellar.png",primaryColor:"#059669",category:["all","simple","ats"],layout:"classic"},{id:"aurora",name:"Aurora",description:"Refined two-column layout with clean dividers and balanced hierarchy for ATS-safe modern resumes.",thumbnail:"/templates/aurora.png",primaryColor:"#4f46e5",category:["all","modern","professional","ats"],layout:"sidebar"},{id:"zenith",name:"Zenith",description:"Executive-focused layout with crisp metrics, clear sectioning, and ATS-friendly structure.",thumbnail:"/templates/zenith.png",primaryColor:"#0f766e",category:["all","professional","ats"],layout:"executive"},{id:"pulse",name:"Pulse",description:"High-energy but structured resume with prominent achievements and ATS-ready readability.",thumbnail:"/templates/pulse.png",primaryColor:"#ea580c",category:["all","modern","professional","ats"],layout:"modern"},{id:"classic",name:"Classic",description:"Timeless traditional format trusted by hiring managers across all industries.",thumbnail:"/templates/classic.png",primaryColor:"#1f2937",category:["all","simple","ats","professional"],layout:"classic"},{id:"metro",name:"Metro",description:"Clean lines and organized sections inspired by modern urban design.",thumbnail:"/templates/metro.png",primaryColor:"#0d9488",category:["all","professional","modern"],layout:"minimal"},{id:"bold",name:"Bold",description:"Confident visual identity with disciplined spacing and ATS-friendly single-column reading flow.",thumbnail:"/templates/bold.png",primaryColor:"#b91c1c",category:["all","modern","professional","ats"],layout:"bold"},{id:"summit",name:"Summit",description:"Straightforward recruiter-friendly layout with understated accents and strong scannability.",thumbnail:"/templates/summit.png",primaryColor:"#334155",category:["all","simple","professional","ats"],layout:"classic"},{id:"horizon",name:"Horizon",description:"Minimal two-column structure that keeps key details visible while preserving ATS readiness.",thumbnail:"/templates/horizon.png",primaryColor:"#0f766e",category:["all","modern","professional","ats"],layout:"minimal"},{id:"apex",name:"Apex",description:"Leadership-focused format with measured accents for senior, operations, and strategy roles.",thumbnail:"/templates/apex.png",primaryColor:"#1d4ed8",category:["all","professional","ats"],layout:"executive"},{id:"clarity",name:"Clarity",description:"Clean no-friction template designed for ATS parsing and high readability across industries.",thumbnail:"/templates/clarity.png",primaryColor:"#475569",category:["all","simple","ats","professional"],layout:"minimal"},{id:"forge",name:"Forge",description:"Structured modern resume with durable hierarchy for technical and project-based roles.",thumbnail:"/templates/forge.png",primaryColor:"#7c3aed",category:["all","modern","professional","ats"],layout:"classic"},{id:"boardroom",name:"Boardroom",description:"A polished grayscale layout inspired by modern corporate resumes with photo, timeline experience, and a crisp two-column structure.",thumbnail:"/templates/boardroom.png",primaryColor:"#6b7280",category:["all","professional","ats"],layout:"classic"},{id:"harvard",name:"Harvard",description:"The gold standard resume format used by Harvard Business School. Clean, professional, and universally accepted.",thumbnail:"/templates/harvard.png",primaryColor:"#1e1e1e",category:["all","professional","ats","simple"],layout:"harvard"}]])},618566,(e,t,i)=>{t.exports=e.r(976562)},734426,e=>{"use strict";var t=e.i(843476),i=e.i(718938),a=e.i(511841);e.s(["Spinner",0,function({className:e,...r}){return(0,t.jsx)(a.Loader2,{role:"status","aria-label":"Loading",className:(0,i.cn)("size-4 animate-spin",e),...r})}])},674094,e=>{"use strict";var t=e.i(843476),i=e.i(271645),a=e.i(248425),r=i.forwardRef((e,i)=>(0,t.jsx)(a.Primitive.label,{...e,ref:i,onMouseDown:t=>{t.target.closest("button, input, select, textarea")||(e.onMouseDown?.(t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));r.displayName="Label",e.s(["Label",0,r,"Root",0,r],444461);var o=e.i(444461),o=o,n=e.i(718938);e.s(["Label",0,function({className:e,...i}){return(0,t.jsx)(o.Root,{"data-slot":"label",className:(0,n.cn)("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",e),...i})}],674094)},199863,964053,e=>{"use strict";var t=e.i(843476),i=e.i(326999);e.s(["Dialog",0,i],964053);var i=i,a=e.i(718938),r=e.i(78549);e.i(197379);var o=e.i(472804),n=e.i(568275);function s({...e}){return(0,t.jsx)(i.Portal,{"data-slot":"dialog-portal",...e})}function l({className:e,...r}){return(0,t.jsx)(i.Overlay,{"data-slot":"dialog-overlay",className:(0,a.cn)("fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",e),...r})}e.s(["Dialog",0,function({...e}){return(0,t.jsx)(i.Root,{"data-slot":"dialog",...e})},"DialogContent",0,function({className:e,children:d,showCloseButton:c=!0,...p}){return(0,t.jsxs)(s,{children:[(0,t.jsx)(l,{}),(0,t.jsxs)(i.Content,{"data-slot":"dialog-content",className:(0,a.cn)("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",e),...p,children:[d,c&&(0,t.jsx)(i.Close,{"data-slot":"dialog-close",asChild:!0,children:(0,t.jsxs)(r.Button,{variant:"ghost",className:"absolute top-4 right-4",size:"icon-sm",children:[(0,t.jsx)(o.HugeiconsIcon,{icon:n.Cancel01Icon,strokeWidth:2}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})})]})]})},"DialogDescription",0,function({className:e,...r}){return(0,t.jsx)(i.Description,{"data-slot":"dialog-description",className:(0,a.cn)("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",e),...r})},"DialogFooter",0,function({className:e,showCloseButton:o=!1,children:n,...s}){return(0,t.jsxs)("div",{"data-slot":"dialog-footer",className:(0,a.cn)("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",e),...s,children:[n,o&&(0,t.jsx)(i.Close,{asChild:!0,children:(0,t.jsx)(r.Button,{variant:"outline",children:"Close"})})]})},"DialogHeader",0,function({className:e,...i}){return(0,t.jsx)("div",{"data-slot":"dialog-header",className:(0,a.cn)("flex flex-col gap-2",e),...i})},"DialogTitle",0,function({className:e,...r}){return(0,t.jsx)(i.Title,{"data-slot":"dialog-title",className:(0,a.cn)("font-heading text-base leading-none font-medium",e),...r})}],199863)},959411,e=>{"use strict";var t=e.i(271645),i=e.i(248425),a=e.i(843476),r=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),o=t.forwardRef((e,t)=>(0,a.jsx)(i.Primitive.span,{...e,ref:t,style:{...r,...e.style}}));o.displayName="VisuallyHidden",e.s(["Root",0,o,"VISUALLY_HIDDEN_STYLES",0,r])},479431,e=>{"use strict";var t=e.i(843476),i=e.i(271645),a=e.i(618566),r=e.i(78549),o=e.i(674094),n=e.i(734426),s=e.i(199863),l=e.i(375460),d=e.i(994566),c=e.i(511841);async function p({data:e,template:t,fileName:i,designOptions:a,customColor:r}){let o=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(o||(o=document.querySelector("[data-resume-preview]")),!o)throw Error("Resume preview element not found. Please ensure the resume is rendered on the page.");let n=o.cloneNode(!0);!function(e,t){let i=[e,...Array.from(e.querySelectorAll("*"))],a=[t,...Array.from(t.querySelectorAll("*"))],r=Math.min(i.length,a.length);for(let e=0;e<r;e++){let t=i[e],r=a[e];if(!(r instanceof HTMLElement))continue;let o=window.getComputedStyle(t),n=Array.from(o).map(e=>`${e}:${o.getPropertyValue(e)};`).join("");r.style.cssText=n}}(o,n),n.querySelectorAll("img").forEach(e=>{let t=e.getAttribute("src");if(t)try{let i=new URL(t,window.location.origin).toString();e.setAttribute("src",i)}catch{}});let s=window.getComputedStyle(o).backgroundColor||"#ffffff";n.querySelectorAll("button, input, select, textarea, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]").forEach(e=>{e.remove()});let l=Array.from(document.querySelectorAll('head link[rel="preconnect"], head link[rel="stylesheet"]')).filter(e=>{let t=e.getAttribute("href")||"";return t.includes("fonts.googleapis.com")||t.includes("fonts.gstatic.com")}).map(e=>e.outerHTML).join("\n"),d=`
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
  `.trim(),c=await fetch("/api/resume/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:d,fileName:i})});if(!c.ok){let e=await c.text();throw Error(`Failed to generate PDF: ${e}`)}let m=await c.blob(),u=URL.createObjectURL(m),f=document.createElement("a");f.href=u,f.download=`${i}.pdf`,document.body.appendChild(f),f.click(),f.remove(),URL.revokeObjectURL(u)}let m={fontFamily:"Inter, sans-serif",fontSize:11,lineSpacing:1.6,sectionSpacing:20,paragraphSpacing:12};function u(e,t){return`
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
  `}let f=["display","position","top","right","bottom","left","float","clear","width","height","max-width","max-height","min-width","min-height","margin","margin-top","margin-right","margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom","padding-left","border","border-top","border-right","border-bottom","border-left","border-radius","box-sizing","background","background-color","color","font","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-transform","text-decoration","white-space","word-break","overflow","overflow-x","overflow-y","flex","flex-direction","flex-wrap","justify-content","align-items","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","opacity"];async function h({data:e,template:t,fileName:i,designOptions:a,customColor:r}){let o,n=document.querySelector("[data-resume-export-preview] [data-resume-preview]");if(n){var s;let e,t,i=n.cloneNode(!0);i.style.width="210mm",i.style.maxWidth="210mm",i.style.minHeight="auto",i.style.margin="0 auto",i.style.backgroundColor="#ffffff",i.style.borderRadius="0",i.style.boxShadow="none",i.style.overflow="visible",i.style.height="auto";let a=i.querySelector("[data-resume-content]");a&&(a.style.overflow="visible",a.style.height="auto",a.style.maxHeight="none"),e=[n,...Array.from(n.querySelectorAll("*"))],t=[i,...Array.from(i.querySelectorAll("*"))],e.forEach((e,i)=>{let a=t[i];if(!(e instanceof HTMLElement)||!a)return;let r=window.getComputedStyle(e),o=f.map(e=>`${e}:${r.getPropertyValue(e)};`).join("");a.setAttribute("style",o)}),i.querySelectorAll("[data-preview-header], [data-preview-footer], [data-page-break-indicator], button, input, select").forEach(e=>{e.remove()}),s=i.outerHTML,o=`
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
  `}else o=function({data:e,template:t,designOptions:i}){var a,r,o,n,s,l,d,c,p,m,f,h;let g=t.layout||"classic",y="harvard"===g,b=`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: ${i.fontFamily}; 
        font-size: ${i.fontSize}pt; 
        line-height: ${i.lineSpacing};
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .title { font-size: 12pt; color: #666; margin-top: 5px; }
      .contact-info { font-size: 10pt; color: #666; margin-top: 10px; }
      .section { margin-bottom: ${i.sectionSpacing}px; page-break-inside: avoid; }
      .entry { margin-bottom: ${i.paragraphSpacing}px; page-break-inside: avoid; }
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
  <style>${function(e,t,i){switch(e){case"harvard":return`
        .header { text-align: center; margin-bottom: ${i.sectionSpacing}px; border-bottom: 1px solid #1e1e1e; padding-bottom: 15px; }
        .name { font-size: 22pt; font-weight: bold; color: #1e1e1e; text-transform: uppercase; letter-spacing: 1px; }
        .section-title { 
          font-size: 11pt; 
          font-weight: bold; 
          color: #1e1e1e; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          border-bottom: 1px solid #1e1e1e; 
          padding-bottom: 3px; 
          margin-bottom: ${i.paragraphSpacing}px; 
        }
        .entry-title { font-weight: bold; color: #1e1e1e; }
        .entry-position { font-style: italic; }
      `;case"modern":return`
        .header { text-align: left; margin-bottom: ${i.sectionSpacing}px; border-bottom: 3px solid ${t}; padding-bottom: 15px; }
        .name { font-size: 26pt; font-weight: bold; color: ${t}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${i.paragraphSpacing}px; 
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
          margin-bottom: ${i.paragraphSpacing}px; 
        }
        .entry { border-left: 4px solid ${t}; padding-left: 15px; }
      `;case"minimal":return`
        .header { text-align: center; margin-bottom: ${i.sectionSpacing}px; }
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
          margin-bottom: ${i.paragraphSpacing}px; 
        }
      `;case"executive":return`
        .header { margin-bottom: ${i.sectionSpacing}px; border-bottom: 2px solid ${t}; padding-bottom: 15px; }
        .name { font-size: 28pt; font-weight: bold; color: ${t}; }
        .summary { border-left: 4px solid ${t}; padding-left: 15px; font-style: italic; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${i.paragraphSpacing}px; 
        }
      `;case"sidebar":return`
        .header { text-align: center; margin-bottom: ${i.sectionSpacing}px; }
        .name { font-size: 22pt; font-weight: bold; color: ${t}; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${i.paragraphSpacing}px; 
        }
      `;default:return`
        .header { text-align: center; margin-bottom: ${i.sectionSpacing}px; border-top: 4px solid ${t}; padding-top: 20px; }
        .name { font-size: 24pt; font-weight: bold; color: ${t}; text-transform: uppercase; letter-spacing: 2px; }
        .section-title { 
          font-size: 12pt; 
          font-weight: bold; 
          color: ${t}; 
          text-transform: uppercase; 
          border-bottom: 2px solid ${t}; 
          padding-bottom: 5px; 
          margin-bottom: ${i.paragraphSpacing}px; 
        }
      `}}(g,t.primaryColor,i)}</style>`;return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${e.contact.firstName} ${e.contact.lastName} - Resume</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      ${b}
    </head>
    <body>
      ${a=e,`
    <div class="header">
      <div class="name">${a.contact.firstName||"Your"} ${a.contact.lastName||"Name"}</div>
      ${a.contact.desiredJobTitle?`<div class="title">${a.contact.desiredJobTitle}</div>`:""}
      <div class="contact-info">
        ${[a.contact.email,a.contact.phone].filter(Boolean).join(" | ")}
      </div>
    </div>
  `}
      ${!y&&e.summary?(r=e.summary,`
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${r}</div>
    </div>
  `):""}
      ${y&&e.educations.length>0?u(e.educations,y):""}
      ${e.experiences.length>0?(o=e.experiences,n=y,`
    <div class="section">
      <div class="section-title">Experience</div>
      ${o.map(e=>`
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
      ${!y&&e.educations.length>0?u(e.educations,y):""}
      ${e.skills.length>0?(s=e.skills,l=y,`
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
      ${e.finalize.hobbies.length>0?(h=e.finalize.hobbies,`
    <div class="section">
      <div class="section-title">Hobbies & Interests</div>
      <div>${h.map(e=>e.name).join(", ")}</div>
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
  `}({data:e,template:{primaryColor:r||t.primaryColor,layout:t.layout||"classic"},designOptions:a});let l=new Blob([o],{type:"application/msword"}),d=URL.createObjectURL(l),c=document.createElement("a");c.href=d,c.download=`${i}.doc`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(d)}e.s(["DownloadDialog",0,function({data:e,isOpen:u,onClose:f,designOptions:g=m,customFileName:y,customColor:b,showPhoto:x=!1,onDownloadComplete:v}){let w=(0,a.useRouter)(),[$,S]=(0,i.useState)("pdf"),[C,j]=(0,i.useState)(!1),[k,z]=(0,i.useState)(!1),A=l.resumeTemplates.find(t=>t.id===e.templateId)||l.resumeTemplates[0],D=y||`${e.contact.firstName||"Resume"}_${e.contact.lastName||"CV"}`,N=async()=>{if(k)return void w.push("/dashboard");j(!0);try{"pdf"===$?(await new Promise(e=>setTimeout(e,100)),await p({data:e,template:A,fileName:D,designOptions:g,customColor:b})):await h({data:e,template:A,fileName:D,designOptions:g,customColor:b}),z(!0),v&&v()}catch(e){console.error("Download failed:",e),alert("Failed to generate resume. Please try again.")}finally{j(!1)}};return((0,i.useEffect)(()=>{u&&setTimeout(()=>{let e=document.querySelector("[data-resume-export-preview] [data-resume-preview]");e&&e.getBoundingClientRect()},50)},[u]),u)?(0,t.jsxs)(t.Fragment,{children:[u&&(0,t.jsx)("div",{"data-resume-export-preview":!0,style:{position:"fixed",left:"-10000px",top:0,width:"210mm",height:"auto",overflow:"visible",visibility:"visible"},children:(0,t.jsx)(d.ResumePreview,{data:e,designOptions:g,customColor:b,showPhoto:x,showScore:!1,showFooter:!1,plain:!0,renderAllPages:!0})}),(0,t.jsx)(s.Dialog,{open:u,onOpenChange:f,children:(0,t.jsxs)(s.DialogContent,{className:"sm:max-w-md",children:[(0,t.jsxs)(s.DialogHeader,{children:[(0,t.jsx)("div",{className:"flex justify-center mb-4",children:(0,t.jsx)("div",{className:"inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10",children:(0,t.jsx)(c.Download,{className:"h-6 w-6 text-primary"})})}),(0,t.jsx)(s.DialogTitle,{className:"text-center",children:"Download Your Resume"}),(0,t.jsx)(s.DialogDescription,{className:"text-center",children:"Choose your preferred format"})]}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsx)(o.Label,{className:"text-sm font-medium",children:"Select Format"}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-3",children:[(0,t.jsxs)("button",{onClick:()=>S("pdf"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"pdf"===$?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.FileText,{className:`h-8 w-8 ${"pdf"===$?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"PDF"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Best for sharing"})]}),(0,t.jsxs)("button",{onClick:()=>S("docx"),className:`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${"docx"===$?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`,children:[(0,t.jsx)(c.File,{className:`h-8 w-8 ${"docx"===$?"text-primary":"text-muted-foreground"}`}),(0,t.jsx)("span",{className:"font-medium",children:"DOCX"}),(0,t.jsx)("span",{className:"text-xs text-muted-foreground",children:"Easy to edit"})]})]}),(0,t.jsxs)("div",{className:"bg-muted/50 rounded-lg p-3 text-sm",children:[(0,t.jsxs)("p",{className:"font-medium mb-1",children:["File: ",D,".",$]}),(0,t.jsxs)("p",{className:"text-muted-foreground text-xs",children:["Template: ",A.name]})]}),(0,t.jsxs)("div",{className:"flex gap-3 pt-2",children:[(0,t.jsx)(r.Button,{variant:"outline",onClick:f,className:"flex-1",children:"Cancel"}),(0,t.jsx)(r.Button,{onClick:N,disabled:C,className:"flex-1",children:C?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.Spinner,{className:"mr-2 h-4 w-4"}),"Downloading..."]}):k?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.ArrowRight,{className:"mr-2 h-4 w-4"}),"Go To Dashboard"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(c.Download,{className:"mr-2 h-4 w-4"}),"Download ",$.toUpperCase()]})})]})]})]})})]}):null}],479431)}]);