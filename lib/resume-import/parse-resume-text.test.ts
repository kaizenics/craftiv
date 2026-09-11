import { describe, expect, it } from "vitest";

import {
  hasImportableContent,
  parsePeriod,
  parseResumeText,
  parseSingleDate,
} from "@/lib/resume-import/parse-resume-text";

/**
 * The first groups port Reactive Resume's plain-text importer tests (MIT) to Craftiv's
 * ResumeDataJSON shape; the rest cover the changes made for Craftiv.
 */

const SAMPLE = `Ada Lovelace
Senior Software Engineer
Berlin, Germany | ada@example.com | +44 20 7946 0100 | https://ada.dev

SUMMARY
Engineer with 10 years building analytical systems.

WORK EXPERIENCE
Analytical Engines  Senior Engineer  Berlin
Jan 2020 - Present
• Led the difference engine rewrite
• Mentored four junior engineers
Babbage Ltd  Engineer  London
Mar 2016 - Dec 2019
• Built the punch card pipeline

EDUCATION
University of London  BSc Mathematics
2012 - 2016

SKILLS
TypeScript, Rust, PostgreSQL

LANGUAGES
English (Native)
German (B2)

CERTIFICATIONS
AWS Solutions Architect  Amazon  2021
`;

describe("parseResumeText", () => {
  const data = parseResumeText(SAMPLE);

  it("reads the contact block", () => {
    expect(data.contact).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      desiredJobTitle: "Senior Software Engineer",
      email: "ada@example.com",
      phone: "+44 20 7946 0100",
    });
    expect(data.finalize.websites).toMatchObject([{ url: "https://ada.dev", label: "Website" }]);
  });

  it("reads the summary", () => {
    expect(data.summary).toBe("Engineer with 10 years building analytical systems.");
  });

  it("splits experience into one entry per role, with split dates", () => {
    expect(data.experiences).toHaveLength(2);
    expect(data.experiences[0]).toMatchObject({
      employer: "Analytical Engines",
      jobTitle: "Senior Engineer",
      location: "Berlin",
      startDate: "2020-01",
      endDate: "Present",
      isCurrentJob: true,
    });
    expect(data.experiences[1]).toMatchObject({
      employer: "Babbage Ltd",
      jobTitle: "Engineer",
      startDate: "2016-03",
      endDate: "2019-12",
      isCurrentJob: false,
    });
  });

  it("keeps bullets as bullet lines", () => {
    expect(data.experiences[0]?.description).toBe(
      "• Led the difference engine rewrite\n• Mentored four junior engineers",
    );
  });

  it("reads education", () => {
    expect(data.educations[0]).toMatchObject({
      schoolName: "University of London",
      degree: "BSc Mathematics",
      startDate: "2012",
      endDate: "2016",
    });
  });

  it("splits a comma separated skills line, without inventing a level", () => {
    expect(data.skills.map((skill) => skill.name)).toEqual(["TypeScript", "Rust", "PostgreSQL"]);
    expect(data.skills.every((skill) => skill.showLevel === false)).toBe(true);
  });

  it("splits a language from its fluency", () => {
    expect(data.finalize.languages).toMatchObject([
      { name: "English", proficiency: "Native" },
      { name: "German", proficiency: "Conversational" },
    ]);
  });

  it("reads a trailing year as the certification date", () => {
    expect(data.finalize.certifications[0]).toMatchObject({
      name: "AWS Solutions Architect",
      issuer: "Amazon",
      date: "2021",
    });
  });

  it("produces no markup of its own", () => {
    expect(JSON.stringify(data)).not.toMatch(/<(?:ul|li|p)>/);
  });
});

describe("parseResumeText edge cases", () => {
  it("returns empty data for empty input", () => {
    const data = parseResumeText("");
    expect(data.contact.firstName).toBe("");
    expect(data.experiences).toEqual([]);
    expect(hasImportableContent(data)).toBe(false);
  });

  it("does not mistake a date range for a phone number", () => {
    expect(parseResumeText("Ada Lovelace\nBerlin\n2016 - 2019\n").contact.phone).toBe("");
  });

  it("keeps an unrecognized heading as a custom section", () => {
    const data = parseResumeText("Ada\n\nSKILLS\nRust\n\nSPEAKING\nGave a talk at a conference\n");
    expect(data.finalize.customSections).toMatchObject([
      { sectionName: "SPEAKING", description: "Gave a talk at a conference" },
    ]);
  });

  it("keeps unclassified header parts in the description rather than dropping them", () => {
    const data = parseResumeText("EXPERIENCE\nAcme  Engineer  Berlin  Remote  Contract\n2020 - 2022\n");
    expect(data.experiences[0]?.description).toContain("Remote");
    expect(data.experiences[0]?.description).toContain("Contract");
  });

  it("keeps source text literal rather than escaping it", () => {
    // React escapes on render; escaping here would show "&lt;" to the user.
    expect(parseResumeText("SUMMARY\nI write <b>bold</b> copy\n").summary).toBe("I write <b>bold</b> copy");
  });

  it("treats a heading with a trailing colon as a heading", () => {
    expect(parseResumeText("Ada\n\nSkills:\nRust, Go\n").skills.map((skill) => skill.name)).toEqual([
      "Rust",
      "Go",
    ]);
  });

  it("keeps a section whose heading is the first one in the document", () => {
    const data = parseResumeText(
      "Ada Lovelace\nada@example.com\n\nCAREER HIGHLIGHTS\nShipped the difference engine\nMentored the team\n",
    );
    expect(data.finalize.customSections[0]).toMatchObject({ sectionName: "CAREER HIGHLIGHTS" });
    expect(JSON.stringify(data)).toContain("Shipped the difference engine");
  });

  it("keeps one entry when company, position and dates sit on separate lines", () => {
    const data = parseResumeText("EXPERIENCE\nAnalytical Engines\nSenior Engineer\nJan 2020 - Present\n• Led the rewrite\n");
    expect(data.experiences).toHaveLength(1);
    expect(data.experiences[0]).toMatchObject({
      employer: "Analytical Engines",
      jobTitle: "Senior Engineer",
      startDate: "2020-01",
      endDate: "Present",
    });
  });

  it("does not turn an uppercase company name into a section heading", () => {
    const data = parseResumeText("EXPERIENCE\nACME CORPORATION\nJan 2020 - Present\n• Did the work\n");
    expect(data.finalize.customSections).toHaveLength(0);
    expect(data.experiences[0]).toMatchObject({ employer: "ACME CORPORATION" });
  });

  it("keeps company, role, location and dates as one entry", () => {
    const data = parseResumeText(
      "EXPERIENCE\nACME CORPORATION\nSenior Engineer\nBerlin, Germany\nJan 2020 - Present\n• Led the rewrite\n",
    );
    expect(data.experiences).toHaveLength(1);
    expect(data.experiences[0]).toMatchObject({
      employer: "ACME CORPORATION",
      jobTitle: "Senior Engineer",
      location: "Berlin, Germany",
    });
  });

  it("keeps school, degree, location and dates as one entry", () => {
    const data = parseResumeText("EDUCATION\nUNIVERSITY OF LONDON\nBSc Mathematics\nLondon, UK\n2012 - 2016\n");
    expect(data.educations).toHaveLength(1);
    expect(data.educations[0]).toMatchObject({
      schoolName: "UNIVERSITY OF LONDON",
      degree: "BSc Mathematics",
      location: "London, UK",
    });
  });

  it("recognizes isolated title-case custom section headings", () => {
    const data = parseResumeText(
      "Ada Lovelace\nada@example.com\n\nEXPERIENCE\nAcme  Engineer\n2020 - 2022\nBuilt products.\n\nConferences\nReactConf\nBerlin\n2021\nSpoke about parsers\n",
    );
    expect(data.finalize.customSections[0]).toMatchObject({ sectionName: "Conferences" });
    expect(data.experiences).toHaveLength(1);
  });

  it("keeps unbulleted descriptions with their own role", () => {
    const data = parseResumeText(
      "EXPERIENCE\nAcme  Engineer  Berlin\nJan 2020 - Present\nBuilt the thing end to end.\nWorked with a team of five.\nBabbage Ltd  Engineer  London\nMar 2016 - Dec 2019\nDid other work.\n",
    );
    expect(data.experiences).toHaveLength(2);
    expect(data.experiences[0]?.description).toContain("Built the thing end to end.");
    expect(data.experiences[0]?.description).toContain("Worked with a team of five.");
    expect(data.experiences[1]).toMatchObject({ employer: "Babbage Ltd", location: "London" });
  });

  it("does not split an entry on a bare year in a section that ignores single dates", () => {
    const data = parseResumeText("EXPERIENCE\nAcme  Engineer\nJan 2020 - Present\nGrew the team.\nMore work here.\n2022\n");
    expect(data.experiences).toHaveLength(1);
    for (const line of ["Grew the team.", "More work here.", "2022"]) {
      expect(data.experiences[0]?.description).toContain(line);
    }
  });

  it("copes with a section that starts with its dates", () => {
    const data = parseResumeText(
      "EXPERIENCE\nJan 2020 - Present\nAcme Corp\nSenior Engineer\n\nEDUCATION\n2012 - 2016\nUniversity of London\n\nCERTIFICATIONS\n2021\n",
    );
    expect(data.experiences[0]).toMatchObject({ employer: "Acme Corp", startDate: "2020-01" });
    expect(data.educations[0]).toMatchObject({ schoolName: "University of London" });
    expect(data.finalize.certifications).toHaveLength(0);
  });
});

describe("parseResumeText Craftiv changes", () => {
  it("reads a 'Title at Company' header", () => {
    const data = parseResumeText("EXPERIENCE\nSenior Engineer at Acme Corp\n2020 - 2022\n");
    expect(data.experiences[0]).toMatchObject({ employer: "Acme Corp", jobTitle: "Senior Engineer" });
  });

  it("reorders a title-first header", () => {
    const data = parseResumeText("EXPERIENCE\nVirtual Assistant | Northstar Commerce\nJan 2021 - Present\n");
    expect(data.experiences[0]).toMatchObject({
      employer: "Northstar Commerce",
      jobTitle: "Virtual Assistant",
    });
  });

  it("rejoins a bullet that wrapped onto a second line", () => {
    const data = parseResumeText(
      "EXPERIENCE\nAcme  Engineer\n2020 - 2022\n• Led the rewrite of the billing system across\nthree regions\n• Hired two engineers\n",
    );
    expect(data.experiences[0]?.description).toBe(
      "• Led the rewrite of the billing system across three regions\n• Hired two engineers",
    );
  });

  it("rejoins a wrapped summary into one paragraph", () => {
    const data = parseResumeText("SUMMARY\nEngineer with a decade of experience building\nanalytical systems.\n");
    expect(data.summary).toBe("Engineer with a decade of experience building analytical systems.");
  });

  it("reorders a degree-first education header", () => {
    const data = parseResumeText("EDUCATION\nBSc Mathematics  University of London\n2012 - 2016\n");
    expect(data.educations[0]).toMatchObject({
      schoolName: "University of London",
      degree: "BSc Mathematics",
    });
  });

  it("strips category labels from skills", () => {
    const data = parseResumeText("SKILLS\nLanguages: TypeScript, Rust\nTools: Figma, Notion\n");
    expect(data.skills.map((skill) => skill.name)).toEqual(["TypeScript", "Rust", "Figma", "Notion"]);
  });

  it("does not read Word's paragraph spacing as headings", () => {
    const docx =
      "Ada Lovelace\n\nada@example.com\n\nEXPERIENCE\n\nAcme  Engineer\n\nJan 2020 - Present\n\nBuilt Things\n\nSKILLS\n\nRust\n";
    const data = parseResumeText(docx, { source: "docx" });
    expect(data.finalize.customSections).toHaveLength(0);
    expect(data.experiences).toHaveLength(1);
    expect(data.experiences[0]?.description).toContain("Built Things");
  });

  it("labels well-known profile links", () => {
    const data = parseResumeText("Ada Lovelace\nada@example.com | linkedin.com/in/ada | https://github.com/ada\n");
    expect(data.finalize.websites).toMatchObject([
      { label: "LinkedIn", url: "linkedin.com/in/ada" },
      { label: "GitHub", url: "https://github.com/ada" },
    ]);
  });

  it("title-cases a shouted name", () => {
    expect(parseResumeText("ADA LOVELACE\nada@example.com\n").contact).toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });

  it("does not read the word before a year as a month", () => {
    // "Amazon 2021" and "Berlin 2016 - 2019" first match with the word attached; the
    // date behind it must still be found.
    const data = parseResumeText(
      "EXPERIENCE\nAcme  Engineer  Berlin 2016 - 2019\n\nCERTIFICATIONS\nAWS Architect  Amazon 2021\n",
    );
    expect(data.experiences[0]).toMatchObject({ startDate: "2016", endDate: "2019", location: "Berlin" });
    expect(data.finalize.certifications[0]).toMatchObject({ issuer: "Amazon", date: "2021" });
  });

  it("skips 'available on request' references", () => {
    expect(parseResumeText("REFERENCES\nAvailable upon request\n").finalize.references).toEqual([]);
  });
});

describe("dates", () => {
  it.each([
    ["Jan 2020 - Present", { start: "2020-01", end: "Present", current: true }],
    ["2016–2019", { start: "2016", end: "2019", current: false }],
    ["01/2020 - 03/2021", { start: "2020-01", end: "2021-03", current: false }],
    ["2020-01 - 2021-03", { start: "2020-01", end: "2021-03", current: false }],
    ["2020-2022", { start: "2020", end: "2022", current: false }],
    ["September 2019 to June 2021", { start: "2019-09", end: "2021-06", current: false }],
  ])("parses %s", (input, expected) => {
    expect(parsePeriod(input)).toEqual(expected);
  });

  it("rejects a backwards range and a bare ISO month", () => {
    expect(parsePeriod("2022 - 2016")).toBeNull();
    expect(parsePeriod("2020-01")).toBeNull();
  });

  it("rejects things that are not dates", () => {
    expect(parseSingleDate("Monday")).toBeNull();
    expect(parseSingleDate("13/2020")).toBeNull();
    expect(parseSingleDate("Mar 2016")).toBe("2016-03");
  });
});
