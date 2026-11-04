import type { Faq } from "@/lib/data/faqs";
import {
  DEFAULT_SECTION_ORDER,
  type Certification,
  type ResumeData,
} from "@/lib/types/resume";

/**
 * Job-specific resume examples behind /resume-examples/[slug].
 *
 * Each page must carry real substance (a full resume, keywords, tips, FAQs) —
 * thin, mass-generated pages get the whole domain demoted. Add new ones in
 * small batches and only once the existing ones are indexed.
 */

type ExampleJob = { title: string; employer: string; location: string; start: string; end: string; bullets: string[] };

type ExampleInput = {
  name: [string, string];
  title: string;
  summary: string;
  jobs: ExampleJob[];
  education: { school: string; degree: string; location: string; start: string; end: string };
  skills: string[];
  certifications?: Omit<Certification, "id">[];
};

export interface ResumeExample {
  slug: string;
  jobTitle: string;
  /** Under ~155 characters; used as the meta description. */
  description: string;
  intro: string;
  templateId: string;
  keywords: string[];
  tips: { title: string; body: string }[];
  faqs: Faq[];
  resume: ResumeData;
}

/** "2022-03" -> "03/2022", the format the builder's month picker stores. */
const toMonthYear = (date: string) => (date ? `${date.slice(5, 7)}/${date.slice(0, 4)}` : "");

function buildResume(slug: string, templateId: string, input: ExampleInput): ResumeData {
  const [firstName, lastName] = input.name;
  return {
    templateId,
    contact: {
      firstName,
      lastName,
      desiredJobTitle: input.title,
      phone: "(555) 010-2030",
      email: `${firstName}.${lastName}@email.com`.toLowerCase(),
    },
    summary: input.summary,
    experiences: input.jobs.map((job, i) => ({
      id: `${slug}-exp-${i + 1}`,
      jobTitle: job.title,
      employer: job.employer,
      location: job.location,
      startDate: toMonthYear(job.start),
      endDate: toMonthYear(job.end),
      isCurrentJob: job.end === "",
      description: job.bullets.map((b) => `- ${b}`).join("\n"),
    })),
    educations: [
      {
        id: `${slug}-edu-1`,
        schoolName: input.education.school,
        location: input.education.location,
        degree: input.education.degree,
        startDate: toMonthYear(input.education.start),
        endDate: toMonthYear(input.education.end),
        description: "",
      },
    ],
    skills: input.skills.map((name, i) => ({
      id: `${slug}-skill-${i + 1}`,
      name,
      level: "Advanced",
      showLevel: false,
    })),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    finalize: {
      languages: [],
      certifications: (input.certifications ?? []).map((c, i) => ({ id: `${slug}-cert-${i + 1}`, ...c, date: toMonthYear(c.date) })),
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
  };
}

function example(
  meta: Omit<ResumeExample, "resume">,
  input: ExampleInput,
): ResumeExample {
  return { ...meta, resume: buildResume(meta.slug, meta.templateId, input) };
}

export const resumeExamples: ResumeExample[] = [
  example(
    {
      slug: "software-engineer",
      jobTitle: "Software Engineer",
      description:
        "A software engineer resume example that passes ATS checks, with the keywords recruiters filter on and tips for writing impact-focused bullets.",
      intro:
        "Engineering recruiters skim for three things: the stack you used, the scale you worked at, and what changed because of your work. This example leads with all three and keeps the layout single-column so tracking systems read it in order.",
      templateId: "harvard",
      keywords: ["TypeScript", "React", "Node.js", "REST APIs", "PostgreSQL", "AWS", "CI/CD", "Docker", "unit testing", "code review", "system design", "agile"],
      tips: [
        { title: "Name the stack in every role", body: "Put the languages and services you used inside the bullet itself, not only in a skills list. ATS keyword matching gives more weight to terms used in context." },
        { title: "Show scale, not just tasks", body: "\"Built an API\" says little. Say how many requests, users or services it handled, and what got faster, cheaper or more reliable." },
        { title: "Link to real work", body: "A GitHub profile or a shipped product URL does more than a long list of frameworks. Add one or two links in your contact details." },
      ],
      faqs: [
        { question: "Should a software engineer resume be one page?", answer: "Under about ten years of experience, yes. Recruiters spend seconds on a first pass, so keep only the roles and projects that match the job you are applying for." },
        { question: "Do I need a projects section?", answer: "If you are early in your career or changing fields, yes. Treat each project like a job: what you built, with what stack, and what it achieved." },
        { question: "Which skills should I list?", answer: "List the languages, frameworks and tools named in the job posting that you have actually used. Leave out ones you only touched once; interviewers will ask about them." },
      ],
    },
    {
      name: ["Daniel", "Okafor"],
      title: "Software Engineer",
      summary: "Full-stack software engineer with 5 years of experience building TypeScript and Node.js services on AWS. Focused on reliable APIs, fast front ends and clean, well-tested code.",
      jobs: [
        {
          title: "Software Engineer II", employer: "Brightline Logistics", location: "Austin, TX", start: "2022-03", end: "",
          bullets: [
            "Rebuilt the shipment tracking API in Node.js and PostgreSQL, cutting median response time from 480 ms to 120 ms",
            "Led migration of 14 services to Docker on AWS ECS with a GitHub Actions CI/CD pipeline",
            "Raised unit test coverage on the billing service from 41% to 85%, reducing production incidents",
            "Mentored two junior engineers through code review and weekly pairing sessions",
          ],
        },
        {
          title: "Software Engineer", employer: "Fernway Health", location: "Remote", start: "2020-01", end: "2022-02",
          bullets: [
            "Built patient scheduling features in React and TypeScript used by 300+ clinics",
            "Designed REST APIs for appointment reminders that lowered no-show rates by 12%",
            "Worked in two-week agile sprints with product and design to ship features every release",
          ],
        },
      ],
      education: { school: "University of Texas at Austin", degree: "B.S. Computer Science", location: "Austin, TX", start: "2015-09", end: "2019-05" },
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "GitHub Actions", "System design"],
    },
  ),
  example(
    {
      slug: "registered-nurse",
      jobTitle: "Registered Nurse",
      description:
        "A registered nurse resume example with clinical keywords, licensure layout and tips for showing patient outcomes on an ATS-friendly resume.",
      intro:
        "Hospital recruiters screen nursing resumes for licensure, unit type and patient load before anything else. This example puts the RN license and certifications where they can be found at a glance and describes care in measurable terms.",
      templateId: "classic",
      keywords: ["patient assessment", "care planning", "medication administration", "EHR", "Epic", "BLS", "ACLS", "patient education", "infection control", "telemetry", "discharge planning", "interdisciplinary team"],
      tips: [
        { title: "Lead with licensure", body: "List your RN license, state and certifications such as BLS and ACLS in their own section. Many hospital systems filter on these before a person ever reads the resume." },
        { title: "Say which unit and how many patients", body: "Med-surg, ICU, ER and telemetry are different jobs. State the unit, bed count and your usual patient ratio." },
        { title: "Name the charting system", body: "If you have used Epic, Cerner or Meditech, say so. It shortens onboarding and is a common search term." },
      ],
      faqs: [
        { question: "Should I include clinical rotations as a new graduate?", answer: "Yes. Treat each rotation as an entry with the unit, hospital and hours, and describe the care you provided under supervision." },
        { question: "Where do certifications go on a nursing resume?", answer: "Near the top or in a dedicated section after experience. Include the issuing body and the expiry or renewal date." },
        { question: "How long should a nurse resume be?", answer: "One page for most nurses, two if you have many years across several specialties. Keep the most relevant unit experience first." },
      ],
    },
    {
      name: ["Maria", "Delgado"],
      title: "Registered Nurse",
      summary: "Registered nurse with 6 years of med-surg and telemetry experience in a 400-bed teaching hospital. Known for thorough assessments, clear patient education and calm teamwork during high-acuity shifts.",
      jobs: [
        {
          title: "Registered Nurse, Telemetry", employer: "St. Anne Medical Center", location: "Phoenix, AZ", start: "2021-06", end: "",
          bullets: [
            "Provide care for 4–5 cardiac telemetry patients per shift, including rhythm monitoring and medication titration",
            "Built discharge education checklists adopted unit-wide, contributing to a drop in 30-day readmissions",
            "Precept new graduate nurses through 12-week orientation",
            "Document assessments and care plans in Epic with zero charting audit findings in 2024",
          ],
        },
        {
          title: "Registered Nurse, Med-Surg", employer: "Valley General Hospital", location: "Mesa, AZ", start: "2019-01", end: "2021-05",
          bullets: [
            "Cared for 5–6 post-operative patients per shift on a 32-bed surgical unit",
            "Served on the infection control committee, helping reduce CAUTI rates on the unit",
            "Coordinated with physicians, therapists and case managers on daily care planning",
          ],
        },
      ],
      education: { school: "Arizona State University", degree: "Bachelor of Science in Nursing (BSN)", location: "Phoenix, AZ", start: "2014-08", end: "2018-05" },
      skills: ["Patient assessment", "Cardiac monitoring", "Medication administration", "Epic EHR", "Patient education", "Wound care", "Care planning", "Infection control"],
      certifications: [
        { name: "Registered Nurse License (AZ)", issuer: "Arizona State Board of Nursing", date: "2018-07" },
        { name: "ACLS", issuer: "American Heart Association", date: "2024-03" },
        { name: "BLS", issuer: "American Heart Association", date: "2024-03" },
      ],
    },
  ),
  example(
    {
      slug: "data-analyst",
      jobTitle: "Data Analyst",
      description:
        "A data analyst resume example with SQL, Python and BI keywords, plus tips for turning analysis work into business results recruiters notice.",
      intro:
        "Hiring managers for analyst roles want proof you can go from a messy question to a decision. This example names the tools in each bullet and ties every analysis to the business result it drove.",
      templateId: "metro",
      keywords: ["SQL", "Python", "Excel", "Tableau", "Power BI", "data visualization", "A/B testing", "dashboards", "ETL", "stakeholder reporting", "statistics", "data cleaning"],
      tips: [
        { title: "End every bullet with the decision", body: "An analysis matters because someone acted on it. Say what changed: budget moved, churn dropped, a feature shipped." },
        { title: "Show your tool depth", body: "\"SQL\" covers everything from SELECT * to window functions. Mention the harder things you do, like cohort analysis or query optimisation." },
        { title: "Add a portfolio link", body: "A public Tableau or GitHub project lets a recruiter check your work in a minute. It matters most for career changers." },
      ],
      faqs: [
        { question: "What skills should a data analyst resume include?", answer: "SQL, a spreadsheet tool, a BI tool such as Tableau or Power BI, and usually Python or R. Match the exact tools named in the posting." },
        { question: "How do I write a data analyst resume with no experience?", answer: "Lead with two or three portfolio projects on public datasets. Describe the question, the method and what you found, just as you would a job." },
        { question: "Should I include certifications?", answer: "They help when you have little work history. A recognised certificate such as Google Data Analytics or a Microsoft Power BI certification is worth listing." },
      ],
    },
    {
      name: ["Priya", "Raman"],
      title: "Data Analyst",
      summary: "Data analyst with 4 years of experience turning product and marketing data into decisions. Strong in SQL, Python and Tableau, with a habit of making dashboards people actually use.",
      jobs: [
        {
          title: "Data Analyst", employer: "Lumen Retail Group", location: "Chicago, IL", start: "2022-02", end: "",
          bullets: [
            "Built a Tableau dashboard suite on top of SQL views that replaced 20 weekly manual Excel reports",
            "Ran A/B test analysis on checkout changes, informing a redesign that raised conversion by 6%",
            "Wrote a Python churn model that flagged at-risk loyalty members for targeted offers",
            "Automated ETL jobs that cleaned and loaded 3M rows of daily sales data",
          ],
        },
        {
          title: "Junior Data Analyst", employer: "Northbeam Marketing", location: "Chicago, IL", start: "2020-07", end: "2022-01",
          bullets: [
            "Produced monthly campaign performance reports for 15 client accounts",
            "Cleaned and merged ad platform exports in Python, cutting report prep time by half",
            "Presented findings to account managers and clients in plain language",
          ],
        },
      ],
      education: { school: "University of Illinois Chicago", degree: "B.S. Statistics", location: "Chicago, IL", start: "2016-08", end: "2020-05" },
      skills: ["SQL", "Python (pandas)", "Tableau", "Power BI", "Excel", "A/B testing", "Statistics", "ETL"],
    },
  ),
  example(
    {
      slug: "project-manager",
      jobTitle: "Project Manager",
      description:
        "A project manager resume example showing budget, scope and team size, with PMP-friendly keywords and tips that help it pass ATS screening.",
      intro:
        "A project manager resume is judged on scale and delivery: how big the project, how many people, and whether it landed on time and on budget. This example states those numbers up front.",
      templateId: "celestial",
      keywords: ["project planning", "stakeholder management", "budget management", "risk management", "Agile", "Scrum", "Waterfall", "Jira", "resource allocation", "PMP", "cross-functional teams", "change management"],
      tips: [
        { title: "Give every project a size", body: "Budget, team size, timeline and number of stakeholders tell a hiring manager how much you can handle." },
        { title: "Match the methodology", body: "If the posting says Agile or Scrum, show where you used it. If it says Waterfall or PRINCE2, show that instead." },
        { title: "Show the rescue stories", body: "Projects that went off track and you brought back are the strongest evidence of PM skill. Include one." },
      ],
      faqs: [
        { question: "Do I need a PMP to get a project manager job?", answer: "Not always, but many postings list it as preferred. If you have it, put it next to your name or in certifications." },
        { question: "How do I show project management experience without the title?", answer: "Describe projects you led in other roles: the goal, the team, the budget and the result. The work counts even without the title." },
        { question: "What metrics belong on a PM resume?", answer: "On-time delivery, budget variance, team size, scope, and the business outcome, such as revenue enabled or cost saved." },
      ],
    },
    {
      name: ["James", "Whitaker"],
      title: "Project Manager",
      summary: "PMP-certified project manager with 7 years of experience delivering software and infrastructure projects up to $2.5M. Comfortable running Agile and Waterfall projects across engineering, finance and operations teams.",
      jobs: [
        {
          title: "Senior Project Manager", employer: "Corvel Systems", location: "Denver, CO", start: "2021-04", end: "",
          bullets: [
            "Delivered a $2.5M ERP rollout across 6 sites, two weeks ahead of schedule and 4% under budget",
            "Ran Scrum ceremonies for three cross-functional teams of 22 engineers, analysts and designers",
            "Introduced a risk register in Jira that surfaced vendor delays a month earlier than before",
            "Reported status to an executive steering committee every two weeks",
          ],
        },
        {
          title: "Project Manager", employer: "Halcyon Energy", location: "Denver, CO", start: "2018-01", end: "2021-03",
          bullets: [
            "Managed 10+ concurrent infrastructure upgrade projects with budgets from $100K to $800K",
            "Recovered a stalled data-centre move by re-planning resources, landing it within the original quarter",
            "Built a change management plan and training that reached 400 staff",
          ],
        },
      ],
      education: { school: "University of Colorado Boulder", degree: "B.S. Business Administration", location: "Boulder, CO", start: "2012-08", end: "2016-05" },
      skills: ["Project planning", "Stakeholder management", "Budget management", "Risk management", "Scrum", "Jira", "MS Project", "Change management"],
      certifications: [{ name: "Project Management Professional (PMP)", issuer: "PMI", date: "2020-09" }],
    },
  ),
  example(
    {
      slug: "customer-service-representative",
      jobTitle: "Customer Service Representative",
      description:
        "A customer service representative resume example with the support keywords ATS filters look for and tips for showing satisfaction scores and volume.",
      intro:
        "Support hiring managers look for volume, quality and tools. This example shows how many contacts the candidate handled, how customers rated them, and which systems they worked in.",
      templateId: "classic",
      keywords: ["customer satisfaction", "CSAT", "first contact resolution", "Zendesk", "Salesforce", "call center", "live chat", "de-escalation", "order processing", "ticketing system", "product knowledge", "multitasking"],
      tips: [
        { title: "Use your scorecard numbers", body: "CSAT, average handle time and first contact resolution are the numbers your manager tracked. Put them on the resume." },
        { title: "List every channel", body: "Phone, email, chat and social are different skills. Say which ones you worked." },
        { title: "Name the software", body: "Zendesk, Freshdesk, Salesforce Service Cloud and similar tools are frequent filter terms." },
      ],
      faqs: [
        { question: "What should a customer service resume summary say?", answer: "Your years of experience, the channels you support, one standout number such as your CSAT score, and the tools you use." },
        { question: "How do I write a customer service resume with no experience?", answer: "Use retail, hospitality or volunteer roles. Anything where you helped people and handled complaints counts." },
        { question: "Which soft skills should I list?", answer: "Show them through results rather than listing them. A bullet about calming an angry customer proves de-escalation better than the word alone." },
      ],
    },
    {
      name: ["Aisha", "Bello"],
      title: "Customer Service Representative",
      summary: "Customer service representative with 4 years of phone, email and chat support for e-commerce and subscription brands. Consistent 95%+ CSAT and a reputation for turning frustrated customers around.",
      jobs: [
        {
          title: "Customer Service Representative", employer: "Pantry Box", location: "Remote", start: "2022-05", end: "",
          bullets: [
            "Resolve 60+ customer contacts a day across phone, email and live chat in Zendesk",
            "Maintain a 96% CSAT score and 88% first contact resolution rate",
            "Wrote 25 help-centre articles that reduced repeat tickets about delivery windows",
            "Handle escalations and refunds within policy, saving at-risk subscriptions",
          ],
        },
        {
          title: "Retail Sales Associate", employer: "Harbor Outfitters", location: "Tampa, FL", start: "2020-03", end: "2022-04",
          bullets: [
            "Helped 100+ shoppers a day with product questions, returns and exchanges",
            "Processed orders and payments accurately on a POS system",
            "Trained four new associates on store policies and the returns process",
          ],
        },
      ],
      education: { school: "Hillsborough Community College", degree: "Associate of Arts", location: "Tampa, FL", start: "2018-08", end: "2020-05" },
      skills: ["Zendesk", "Salesforce Service Cloud", "Live chat", "De-escalation", "Order processing", "Refunds and returns", "Typing 70 WPM", "Product knowledge"],
    },
  ),
  example(
    {
      slug: "marketing-manager",
      jobTitle: "Marketing Manager",
      description:
        "A marketing manager resume example with campaign results, growth metrics and the digital marketing keywords that help it pass ATS filters.",
      intro:
        "Marketing leaders are hired on results: pipeline, revenue, cost per acquisition. This example ties each campaign to a number and shows the channels and tools the candidate owned.",
      templateId: "metro",
      keywords: ["digital marketing", "campaign management", "SEO", "paid social", "Google Ads", "email marketing", "marketing automation", "HubSpot", "content strategy", "brand management", "ROI", "lead generation"],
      tips: [
        { title: "Lead with revenue and pipeline", body: "Impressions and followers are weak signals. Show leads, pipeline, revenue or customer acquisition cost." },
        { title: "Show budget ownership", body: "Say how much budget you managed and how you allocated it across channels." },
        { title: "Name your marketing stack", body: "HubSpot, Marketo, Google Analytics, Meta Ads Manager and similar tools are common search terms." },
      ],
      faqs: [
        { question: "What metrics should a marketing manager resume include?", answer: "Pipeline or revenue generated, cost per lead or acquisition, conversion rates, and budget managed. Pick the ones closest to the job you want." },
        { question: "Should I include a portfolio?", answer: "Yes, for brand and content roles. A link to campaigns, landing pages or case studies makes your claims easy to check." },
        { question: "How do I show leadership on a marketing resume?", answer: "Mention team size, agencies you managed, and decisions you owned, such as channel mix or launch plans." },
      ],
    },
    {
      name: ["Elena", "Marsh"],
      title: "Marketing Manager",
      summary: "B2B marketing manager with 8 years of experience building demand generation programs for SaaS companies. Owns a $1.2M annual budget across paid, email and content, measured on pipeline and revenue.",
      jobs: [
        {
          title: "Marketing Manager", employer: "Stackwise", location: "Boston, MA", start: "2021-01", end: "",
          bullets: [
            "Grew marketing-sourced pipeline from $3M to $8.4M in two years through paid search, LinkedIn and webinars",
            "Cut cost per qualified lead by 35% by moving budget from display to high-intent search",
            "Rebuilt HubSpot lead scoring with sales, raising lead-to-opportunity rate from 9% to 15%",
            "Manage a team of 3 marketers and 2 agencies",
          ],
        },
        {
          title: "Digital Marketing Specialist", employer: "Pivot Learning", location: "Boston, MA", start: "2017-06", end: "2020-12",
          bullets: [
            "Ran Google Ads and Meta campaigns with a $400K annual budget",
            "Launched an SEO content program that grew organic sign-ups by 140%",
            "Built nurture email sequences that recovered 18% of abandoned trials",
          ],
        },
      ],
      education: { school: "Boston University", degree: "B.S. Marketing", location: "Boston, MA", start: "2012-09", end: "2016-05" },
      skills: ["Demand generation", "Google Ads", "LinkedIn Ads", "HubSpot", "SEO", "Email marketing", "Google Analytics", "Budget management"],
    },
  ),
  example(
    {
      slug: "teacher",
      jobTitle: "Teacher",
      description:
        "A teacher resume example with certification, grade levels and classroom results, plus tips for writing an education resume that passes ATS screening.",
      intro:
        "School districts screen teacher resumes for certification, subject and grade level first. This example makes those clear in seconds, then shows student outcomes and the work the candidate did beyond the classroom.",
      templateId: "harvard",
      keywords: ["lesson planning", "classroom management", "differentiated instruction", "curriculum development", "student assessment", "IEP", "parent communication", "Google Classroom", "state standards", "data-driven instruction", "ESL", "student engagement"],
      tips: [
        { title: "Put certification at the top", body: "State, subject area and grade band are often the first filter. Include the certificate in its own section." },
        { title: "Show student results", body: "Test score growth, reading level gains or pass rates are the clearest proof of strong teaching." },
        { title: "Include work outside class", body: "Clubs, coaching, committees and mentoring show a school what you will add beyond your timetable." },
      ],
      faqs: [
        { question: "What should a teacher resume objective say?", answer: "Use a short summary instead: your certification, subject, grade levels and years of experience, plus one strength such as differentiated instruction." },
        { question: "How do I write a first-year teacher resume?", answer: "Lead with student teaching. Describe the grade, subject, lessons you designed and how you assessed students." },
        { question: "Should I list classroom technology?", answer: "Yes. Tools like Google Classroom, Canvas or interactive whiteboards are commonly requested and easy to include in skills." },
      ],
    },
    {
      name: ["Rachel", "Nguyen"],
      title: "Middle School Math Teacher",
      summary: "Certified middle school math teacher with 6 years of experience teaching grades 6–8 in diverse public schools. Uses data-driven, differentiated instruction to raise achievement for every learner.",
      jobs: [
        {
          title: "Math Teacher, Grades 7–8", employer: "Lincoln Middle School", location: "Sacramento, CA", start: "2021-08", end: "",
          bullets: [
            "Teach five sections of 7th and 8th grade math to 140 students, including ESL and IEP students",
            "Raised the share of students meeting state math standards from 48% to 63% in two years",
            "Designed a project-based unit on ratios now used by the whole math department",
            "Lead the after-school math club and mentor two first-year teachers",
          ],
        },
        {
          title: "Math Teacher, Grade 6", employer: "Riverside Elementary", location: "Sacramento, CA", start: "2019-08", end: "2021-06",
          bullets: [
            "Planned standards-aligned lessons and weekly formative assessments",
            "Moved instruction to Google Classroom during remote learning with 95% weekly participation",
            "Held regular parent conferences and sent weekly progress updates",
          ],
        },
      ],
      education: { school: "California State University, Sacramento", degree: "B.A. Mathematics; Single Subject Teaching Credential", location: "Sacramento, CA", start: "2014-08", end: "2019-05" },
      skills: ["Lesson planning", "Differentiated instruction", "Classroom management", "Student assessment", "IEP support", "Google Classroom", "Curriculum development", "Parent communication"],
      certifications: [{ name: "Single Subject Teaching Credential: Mathematics", issuer: "California Commission on Teacher Credentialing", date: "2019-06" }],
    },
  ),
  example(
    {
      slug: "accountant",
      jobTitle: "Accountant",
      description:
        "An accountant resume example with month-end close, reconciliation and ERP keywords, plus tips for showing accuracy and efficiency on an ATS-ready resume.",
      intro:
        "Finance managers want to see that you close the books accurately and on time. This example names the systems, the size of the ledger and the process improvements the candidate made.",
      templateId: "celestial",
      keywords: ["general ledger", "month-end close", "account reconciliation", "GAAP", "accounts payable", "accounts receivable", "financial statements", "QuickBooks", "NetSuite", "Excel", "audit preparation", "variance analysis"],
      tips: [
        { title: "Give your close a timeline", body: "Saying you shortened month-end close from 10 days to 6 is concrete proof of skill." },
        { title: "Name the ERP", body: "NetSuite, SAP, Oracle and QuickBooks experience is often a hard requirement. Put it in your bullets and skills." },
        { title: "Show scale", body: "Mention the number of entities, accounts or transactions you handled, or the company's revenue band." },
      ],
      faqs: [
        { question: "Should I list my CPA status if I have not finished?", answer: "Yes. Write \"CPA candidate\" with the exams passed and expected completion date." },
        { question: "What accounting skills are most in demand?", answer: "Month-end close, reconciliations, GAAP knowledge, ERP experience and advanced Excel such as pivot tables and lookups." },
        { question: "How long should an accountant resume be?", answer: "One page for most roles. Senior or controller-level candidates can use two." },
      ],
    },
    {
      name: ["Michael", "Torres"],
      title: "Staff Accountant",
      summary: "Staff accountant with 5 years of experience in month-end close, reconciliations and financial reporting for multi-entity companies. Advanced Excel and NetSuite user focused on accuracy and faster closes.",
      jobs: [
        {
          title: "Staff Accountant", employer: "Granite Peak Manufacturing", location: "Columbus, OH", start: "2021-09", end: "",
          bullets: [
            "Own month-end close for 3 entities, including journal entries, accruals and reconciliations",
            "Helped shorten the close from 9 to 5 business days by standardising reconciliation templates",
            "Prepare GAAP financial statements and variance analysis for the controller",
            "Led audit preparation with zero material adjustments for two years running",
          ],
        },
        {
          title: "Accounting Associate", employer: "Bluefield CPA Group", location: "Columbus, OH", start: "2019-06", end: "2021-08",
          bullets: [
            "Managed accounts payable and receivable for 20 small-business clients in QuickBooks",
            "Reconciled bank and credit card accounts monthly",
            "Assisted with year-end tax preparation and client workpapers",
          ],
        },
      ],
      education: { school: "Ohio State University", degree: "B.S. Accounting", location: "Columbus, OH", start: "2015-08", end: "2019-05" },
      skills: ["Month-end close", "Account reconciliation", "GAAP", "NetSuite", "QuickBooks", "Advanced Excel", "Financial statements", "Audit preparation"],
    },
  ),
  example(
    {
      slug: "sales-representative",
      jobTitle: "Sales Representative",
      description:
        "A sales representative resume example with quota attainment, pipeline and CRM keywords, plus tips for writing a results-driven sales resume.",
      intro:
        "Sales hiring managers look for one number first: quota attainment. This example puts it in the summary, then backs it up with deal sizes, rankings and the CRM the candidate used.",
      templateId: "metro",
      keywords: ["quota attainment", "B2B sales", "prospecting", "pipeline management", "Salesforce", "cold calling", "lead qualification", "closing", "account management", "negotiation", "CRM", "territory management"],
      tips: [
        { title: "Lead with quota", body: "Percent of quota, year by year, is the clearest signal in sales. Put your best years in the summary." },
        { title: "Show rankings", body: "\"#2 of 18 reps\" gives context that a raw revenue number cannot." },
        { title: "Describe the sale", body: "Deal size, sales cycle length and buyer type tell a manager whether your experience fits their motion." },
      ],
      faqs: [
        { question: "What should a sales resume include?", answer: "Quota attainment, revenue closed, deal size, rankings and awards, plus the CRM and sales tools you used." },
        { question: "How do I write a sales resume with no sales experience?", answer: "Show persuasion and targets from other roles: retail upsells, fundraising, or customer retention numbers." },
        { question: "Should I include President's Club or awards?", answer: "Yes. Sales awards are strong proof and recruiters look for them. List them with the year." },
      ],
    },
    {
      name: ["Chris", "Mbeki"],
      title: "Sales Representative",
      summary: "B2B sales representative with 5 years of experience closing mid-market software deals. Averaged 118% of quota over three years and earned President's Club in 2024.",
      jobs: [
        {
          title: "Account Executive", employer: "Ledgerly", location: "Atlanta, GA", start: "2022-01", end: "",
          bullets: [
            "Closed $1.6M in new annual recurring revenue in 2024, reaching 126% of quota",
            "Ranked #2 of 18 account executives for two consecutive years",
            "Ran full-cycle sales from prospecting to close with an average deal size of $38K",
            "Kept a clean Salesforce pipeline with weekly forecasting accuracy within 5%",
          ],
        },
        {
          title: "Sales Development Representative", employer: "Brightcall", location: "Atlanta, GA", start: "2020-02", end: "2021-12",
          bullets: [
            "Booked 25+ qualified meetings a month through cold calling and email sequences",
            "Exceeded meeting quota for 7 straight quarters",
            "Promoted to account executive after 22 months",
          ],
        },
      ],
      education: { school: "Georgia State University", degree: "B.B.A. Marketing", location: "Atlanta, GA", start: "2015-08", end: "2019-05" },
      skills: ["B2B sales", "Prospecting", "Salesforce", "Pipeline management", "Negotiation", "Cold calling", "Outreach", "Account management"],
    },
  ),
  example(
    {
      slug: "administrative-assistant",
      jobTitle: "Administrative Assistant",
      description:
        "An administrative assistant resume example with office, scheduling and software keywords, plus tips for showing organisation to ATS and recruiters.",
      intro:
        "Admin roles are hired on reliability and range. This example shows who the candidate supported, the systems they ran, and the processes they made smoother for the team.",
      templateId: "classic",
      keywords: ["calendar management", "scheduling", "Microsoft Office", "Google Workspace", "data entry", "travel coordination", "meeting minutes", "office management", "expense reports", "customer service", "filing systems", "confidentiality"],
      tips: [
        { title: "Say who you supported", body: "Supporting one manager is different from supporting a team of twelve or a C-suite executive. State it." },
        { title: "Show the process wins", body: "A new filing system, a faster booking process or a cleaner onboarding checklist are the achievements of a great assistant." },
        { title: "Name your software", body: "Microsoft 365, Google Workspace, Slack, Zoom and expense tools are common filter terms." },
      ],
      faqs: [
        { question: "What skills should an administrative assistant list?", answer: "Calendar and travel management, Microsoft Office or Google Workspace, data entry, written communication and discretion with confidential information." },
        { question: "How do I make an admin resume stand out?", answer: "Add numbers: how many people you supported, how many meetings or trips you booked, and time or money you saved." },
        { question: "Is a summary needed on an admin resume?", answer: "A short one helps. Two sentences on your experience, who you supported and your strongest tools is enough." },
      ],
    },
    {
      name: ["Sarah", "Lindqvist"],
      title: "Administrative Assistant",
      summary: "Administrative assistant with 5 years of experience supporting executives and busy teams. Keeps calendars, travel and office operations running smoothly in Microsoft 365 and Google Workspace.",
      jobs: [
        {
          title: "Executive Administrative Assistant", employer: "Meridian Property Group", location: "Seattle, WA", start: "2021-10", end: "",
          bullets: [
            "Manage calendars, travel and expense reports for the CEO and two vice presidents",
            "Coordinate 30+ meetings a week across three time zones and take minutes for leadership meetings",
            "Created a shared onboarding checklist that cut new-hire setup from three days to one",
            "Handle confidential board materials and contracts",
          ],
        },
        {
          title: "Office Assistant", employer: "Cascade Dental Partners", location: "Seattle, WA", start: "2019-05", end: "2021-09",
          bullets: [
            "Answered phones and greeted 80+ patients a day at a four-dentist practice",
            "Scheduled appointments and managed patient records with complete accuracy",
            "Ordered office supplies and kept a monthly budget",
          ],
        },
      ],
      education: { school: "Seattle Central College", degree: "Associate of Applied Science, Business Administration", location: "Seattle, WA", start: "2017-09", end: "2019-06" },
      skills: ["Calendar management", "Travel coordination", "Microsoft 365", "Google Workspace", "Expense reports", "Meeting minutes", "Data entry", "Confidentiality"],
    },
  ),
  example(
    {
      slug: "virtual-assistant",
      jobTitle: "Virtual Assistant",
      description:
        "A virtual assistant resume example with the remote tools, admin and client keywords clients search for, plus tips for winning remote VA work.",
      intro:
        "Clients hiring a virtual assistant can't watch you work, so they hire on proof: the tools you run, the time zones you cover and what you took off someone's plate. This example puts all three up front.",
      templateId: "meridian",
      keywords: ["inbox management", "calendar management", "Google Workspace", "Microsoft 365", "CRM", "HubSpot", "data entry", "customer support", "social media scheduling", "Canva", "Asana", "time zone coordination"],
      tips: [
        { title: "Lead with the tools", body: "Remote clients filter on software. Name the inbox, calendar, CRM and project tools you use daily, inside the bullets and in your skills." },
        { title: "Show the hours you saved", body: "\"Managed inbox\" is a task. \"Cut the founder's inbox from 400 to under 30 unread a day\" is a result a client can picture." },
        { title: "State your availability", body: "Say which time zones and hours you cover. For overseas clients it is often the deciding detail." },
      ],
      faqs: [
        { question: "What should a virtual assistant put on a resume?", answer: "The clients or kinds of businesses you supported, the tasks you owned, the tools you use and measurable results such as hours saved or response times." },
        { question: "How do I write a VA resume with no experience?", answer: "Use admin, customer service or office work you have done, list the tools you know, and add a short portfolio of sample tasks like a cleaned spreadsheet or a scheduled content calendar." },
        { question: "Should I list hourly rates on my resume?", answer: "No. Keep rates for the proposal or interview. The resume should make the case for your value first." },
      ],
    },
    {
      name: ["Maria", "Santos"],
      title: "Virtual Assistant",
      summary: "Virtual assistant with 4 years of experience supporting founders and small teams in the US and Australia. Runs inboxes, calendars, CRM updates and customer email so clients can focus on growth.",
      jobs: [
        {
          title: "Executive Virtual Assistant", employer: "Northpeak Coaching (remote, US)", location: "Remote", start: "2022-06", end: "",
          bullets: [
            "Manage the founder's inbox and calendar across three time zones, reducing unread email from 400+ to under 30 a day",
            "Keep 1,200 HubSpot contacts current and send weekly pipeline summaries to the sales lead",
            "Schedule 60+ coaching sessions a month and handle rescheduling with clients directly",
            "Plan and post social media content in Canva and Buffer, growing Instagram followers by 35% in a year",
          ],
        },
        {
          title: "Virtual Assistant", employer: "Harbourside Realty (remote, AU)", location: "Remote", start: "2020-09", end: "2022-05",
          bullets: [
            "Answered 50+ customer emails a day with an average reply time under two hours",
            "Built Google Sheets trackers for listings and open homes used by a team of eight agents",
            "Prepared invoices and expense reports in Xero each month",
          ],
        },
      ],
      education: { school: "University of Santo Tomas", degree: "B.S. Business Administration", location: "Manila, Philippines", start: "2015-06", end: "2019-04" },
      skills: ["Inbox management", "Calendar management", "Google Workspace", "HubSpot CRM", "Canva", "Asana", "Xero", "Customer support"],
    },
  ),
  example(
    {
      slug: "graphic-designer",
      jobTitle: "Graphic Designer",
      description:
        "A graphic designer resume example with the design tools and brand keywords recruiters scan for, plus tips for pairing it with your portfolio.",
      intro:
        "A designer's resume is read next to their portfolio, so it should do a different job: show the scope, the tools and the results behind the work. This example keeps the layout clean so the projects carry the page.",
      templateId: "aurora",
      keywords: ["Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Figma", "branding", "typography", "layout design", "visual identity", "print production", "social media graphics", "motion graphics", "art direction"],
      tips: [
        { title: "Link the portfolio at the top", body: "Put the portfolio URL in your contact details. Many recruiters open it before they finish reading the resume." },
        { title: "Describe outcomes, not only deliverables", body: "Pair each project with what it changed: a launch, a conversion lift, a rebrand rolled out across 40 stores." },
        { title: "Keep the resume itself readable", body: "A creative layout is fine, but text in images or unusual columns can confuse ATS. Let the portfolio show your style." },
      ],
      faqs: [
        { question: "Should a graphic designer resume be designed?", answer: "Lightly. Clean typography and a confident layout help, but keep the text selectable and in one reading order so tracking systems can parse it." },
        { question: "What skills should a graphic designer list?", answer: "The Adobe apps and Figma you actually use, plus disciplines such as branding, typography, layout and print or motion work." },
        { question: "How many projects should I mention?", answer: "Two to four strong ones in your experience bullets is plenty. The portfolio holds the rest." },
      ],
    },
    {
      name: ["Kenji", "Watanabe"],
      title: "Graphic Designer",
      summary: "Graphic designer with 6 years of experience in brand identity, campaign and packaging design. Comfortable taking a project from concept sketches to print-ready files and social assets.",
      jobs: [
        {
          title: "Senior Graphic Designer", employer: "Lumen Creative Studio", location: "Portland, OR", start: "2021-04", end: "",
          bullets: [
            "Led the visual identity refresh for a 40-store coffee chain, from logo system to menus and signage",
            "Designed a seasonal campaign in Illustrator and Photoshop that lifted online orders 22% over the prior year",
            "Built a Figma brand library that cut the time to produce social graphics by half",
            "Art-directed two junior designers and a freelance illustrator",
          ],
        },
        {
          title: "Graphic Designer", employer: "Greenleaf Foods", location: "Portland, OR", start: "2018-06", end: "2021-03",
          bullets: [
            "Designed packaging for 25 products and prepared print-ready files for three printers",
            "Produced weekly social media graphics and short motion pieces in After Effects",
            "Created InDesign templates for sales sheets used by the national sales team",
          ],
        },
      ],
      education: { school: "Pacific Northwest College of Art", degree: "B.F.A. Graphic Design", location: "Portland, OR", start: "2014-09", end: "2018-05" },
      skills: ["Adobe Illustrator", "Adobe Photoshop", "Adobe InDesign", "Figma", "After Effects", "Branding", "Typography", "Print production"],
    },
  ),
  example(
    {
      slug: "human-resources-specialist",
      jobTitle: "Human Resources Specialist",
      description:
        "A human resources specialist resume example with recruiting, onboarding and HRIS keywords, plus tips for showing HR impact with numbers.",
      intro:
        "HR hiring managers look for range across the employee lifecycle and for proof you can be trusted with sensitive work. This example covers recruiting, onboarding, policy and systems, each with a measurable result.",
      templateId: "zenith",
      keywords: ["recruiting", "onboarding", "employee relations", "HRIS", "Workday", "BambooHR", "benefits administration", "payroll", "compliance", "performance management", "policy development", "applicant tracking system"],
      tips: [
        { title: "Cover the whole lifecycle", body: "Show you have touched hiring, onboarding, employee relations and offboarding. Range is what separates a specialist from a coordinator." },
        { title: "Quantify people outcomes", body: "Time to hire, turnover, onboarding completion and open roles filled are the numbers HR leaders track. Use them." },
        { title: "Name the systems", body: "Workday, BambooHR, ADP and the applicant tracking systems you have run are frequent filter terms." },
      ],
      faqs: [
        { question: "What should an HR specialist resume include?", answer: "Recruiting volume, onboarding, employee relations, the HR systems you use and any compliance or policy work, with numbers wherever you can." },
        { question: "Do HR certifications matter?", answer: "They help, especially SHRM-CP or PHR in the US. List them under certifications with the year you earned them." },
        { question: "How do I show discretion on a resume?", answer: "Mention the sensitive work you handled, such as investigations or payroll, without any identifying details." },
      ],
    },
    {
      name: ["Aisha", "Rahman"],
      title: "Human Resources Specialist",
      summary: "HR specialist with 5 years of experience across recruiting, onboarding and employee relations for teams of 150 to 600. Runs HR systems that keep people data accurate and processes fair.",
      jobs: [
        {
          title: "Human Resources Specialist", employer: "Brightwave Software", location: "Denver, CO", start: "2021-02", end: "",
          bullets: [
            "Filled 85 roles a year across engineering and sales, cutting average time to hire from 41 to 28 days",
            "Redesigned onboarding in BambooHR, raising 90-day retention from 82% to 93%",
            "Handled employee relations cases and investigations with full confidentiality",
            "Wrote the remote work and parental leave policies adopted company-wide",
          ],
        },
        {
          title: "HR Coordinator", employer: "Summit Health Partners", location: "Denver, CO", start: "2019-01", end: "2021-01",
          bullets: [
            "Coordinated interviews and offer letters for 40+ clinical hires a quarter",
            "Processed benefits enrolment and payroll changes for 600 employees in ADP",
            "Kept I-9 and licensing records audit-ready",
          ],
        },
      ],
      education: { school: "University of Colorado Denver", degree: "B.S. Human Resource Management", location: "Denver, CO", start: "2014-08", end: "2018-05" },
      skills: ["Recruiting", "Onboarding", "Employee relations", "BambooHR", "ADP", "Benefits administration", "Compliance", "Policy development"],
      certifications: [{ name: "SHRM Certified Professional (SHRM-CP)", issuer: "SHRM", date: "2022-06" }],
    },
  ),
  example(
    {
      slug: "business-analyst",
      jobTitle: "Business Analyst",
      description:
        "A business analyst resume example with requirements, SQL and process keywords, plus tips for showing how your analysis changed decisions.",
      intro:
        "A business analyst is hired to turn messy needs into clear requirements and better decisions. This example shows the stakeholders, the methods and the measurable change behind each project.",
      templateId: "slate",
      keywords: ["requirements gathering", "stakeholder management", "SQL", "process mapping", "user stories", "Jira", "Power BI", "Tableau", "gap analysis", "UAT", "agile", "data analysis"],
      tips: [
        { title: "Show the decision, not just the report", body: "Say what the business did differently because of your analysis: a process changed, a cost removed, a feature shipped." },
        { title: "Name your methods", body: "Process mapping, gap analysis, user stories and UAT are the vocabulary of the role, and recruiters filter on them." },
        { title: "Mention who you worked with", body: "BAs sit between teams. Naming finance, operations or engineering partners shows you can work across them." },
      ],
      faqs: [
        { question: "What skills should a business analyst list?", answer: "Requirements gathering, process mapping, SQL, a BI tool such as Power BI or Tableau, Jira or a similar backlog tool, and stakeholder communication." },
        { question: "Do business analysts need technical skills?", answer: "Enough SQL and spreadsheet skill to check data yourself is expected. Coding beyond that depends on the role." },
        { question: "How do I move into business analysis?", answer: "Highlight any time you documented a process, gathered requirements or built a report that changed a decision, even if it was not your job title." },
      ],
    },
    {
      name: ["Tomás", "Herrera"],
      title: "Business Analyst",
      summary: "Business analyst with 5 years of experience in retail and fintech. Turns stakeholder needs into clear requirements and uses SQL and Power BI to show what is really happening in the data.",
      jobs: [
        {
          title: "Business Analyst", employer: "Clearpath Payments", location: "Chicago, IL", start: "2021-07", end: "",
          bullets: [
            "Mapped the merchant onboarding process and removed four manual steps, cutting approval time from 5 days to 2",
            "Wrote 120+ user stories and acceptance criteria in Jira for two agile product teams",
            "Built Power BI dashboards on SQL data that the operations team uses for daily stand-ups",
            "Led UAT for a new disputes portal with 30 testers across finance and support",
          ],
        },
        {
          title: "Junior Business Analyst", employer: "Lakeshore Retail Group", location: "Chicago, IL", start: "2019-06", end: "2021-06",
          bullets: [
            "Ran a gap analysis of the returns process that saved $180K a year in write-offs",
            "Wrote SQL queries to reconcile inventory across 60 stores",
            "Documented requirements for a new point-of-sale integration",
          ],
        },
      ],
      education: { school: "University of Illinois Chicago", degree: "B.S. Information and Decision Sciences", location: "Chicago, IL", start: "2015-08", end: "2019-05" },
      skills: ["Requirements gathering", "Process mapping", "SQL", "Power BI", "Jira", "User stories", "UAT", "Stakeholder management"],
    },
  ),
  example(
    {
      slug: "social-media-manager",
      jobTitle: "Social Media Manager",
      description:
        "A social media manager resume example with platform, content and analytics keywords, plus tips for proving growth with real numbers.",
      intro:
        "Social media managers are judged on growth, so the resume has to read like a results report: which platforms, what content, and how the audience and revenue moved. This example does exactly that.",
      templateId: "pulse",
      keywords: ["content strategy", "Instagram", "TikTok", "LinkedIn", "community management", "social media analytics", "paid social", "Meta Ads", "content calendar", "copywriting", "influencer marketing", "brand voice"],
      tips: [
        { title: "Lead with growth numbers", body: "Followers, engagement rate, reach and revenue from social are what hiring managers look for first. Put one in every role." },
        { title: "Name platforms and formats", body: "Short-form video on TikTok is a different skill from LinkedIn thought leadership. Say which ones you have grown." },
        { title: "Show paid and organic", body: "Many roles now cover both. Mention ad spend you managed and the return it produced." },
      ],
      faqs: [
        { question: "What should a social media manager resume include?", answer: "The platforms you managed, the content you created, growth and engagement numbers, any paid budget you ran, and the tools you use for scheduling and analytics." },
        { question: "Should I link to accounts I managed?", answer: "Yes, if the account is public and you are allowed to. A link to real work is more convincing than a description." },
        { question: "How do I show results if numbers were small?", answer: "Use percentages and timeframes. Growing an account 60% in six months reads well at any size." },
      ],
    },
    {
      name: ["Chloe", "Bennett"],
      title: "Social Media Manager",
      summary: "Social media manager with 5 years of experience growing consumer brands on Instagram, TikTok and LinkedIn. Combines a strong brand voice with weekly analytics to grow audiences and sales.",
      jobs: [
        {
          title: "Social Media Manager", employer: "Bloom & Bark Pet Co.", location: "San Diego, CA", start: "2022-01", end: "",
          bullets: [
            "Grew Instagram from 18K to 96K followers and TikTok from zero to 140K in two years",
            "Managed a $25K monthly Meta Ads budget at a 4.1x return on ad spend",
            "Ran a monthly content calendar of 60+ posts and short videos with a team of two creators",
            "Launched an influencer program that drove 12% of online sales in its first quarter",
          ],
        },
        {
          title: "Social Media Coordinator", employer: "Coastline Outdoor Gear", location: "San Diego, CA", start: "2019-08", end: "2021-12",
          bullets: [
            "Raised average engagement rate from 1.9% to 4.6% with a refreshed brand voice",
            "Answered community comments and messages daily, keeping response time under three hours",
            "Built weekly social analytics reports for the marketing director",
          ],
        },
      ],
      education: { school: "San Diego State University", degree: "B.A. Communication", location: "San Diego, CA", start: "2015-08", end: "2019-05" },
      skills: ["Content strategy", "Instagram", "TikTok", "LinkedIn", "Meta Ads", "Community management", "Copywriting", "Social media analytics"],
    },
  ),
];

export function getResumeExample(slug: string) {
  return resumeExamples.find((e) => e.slug === slug);
}
