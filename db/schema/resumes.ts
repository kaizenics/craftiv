import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Resumes Table
 * Stores resume metadata and full JSON data
 */
export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  templateId: text("template_id").notNull(),
  
  // Store the full resume data as JSON
  data: text("data", { mode: "json" }).$type<ResumeDataJSON>(),
  
  // Metadata
  status: text("status", {
    enum: ["draft", "completed"]
  }).notNull().default("draft"),
  lastEditedSection: text("last_edited_section"),

  /**
   * Who created this resume. Job Hunter writes real `resumes` rows so tailored
   * output inherits the section editor, templates and PDF/DOCX export
   * unchanged -- but those rows must not clutter the documents library, so
   * every list query filters on `origin = "user"`. A "Save to my documents"
   * action flips it, which is the moment the user opts a generated resume in.
   *
   * ResumeCombobox is fed by resume.listSummary and so inherits the filter for
   * free, which is correct: you tailor *from* a real resume, never from a
   * previously generated one.
   */
  origin: text("origin", { enum: ["user", "job_hunter"] })
    .notNull()
    .default("user"),
  
  /** Random id for the public /r/<token> link; null until sharing is first enabled. */
  shareToken: text("share_token").unique(),
  shareEnabled: integer("share_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type for the JSON resume data stored in the database
export interface ResumeDataJSON {
  templateId?: string;
  contact: {
    firstName: string;
    lastName: string;
    desiredJobTitle: string;
    phone: string;
    email: string;
    photoUrl?: string;
  };
  experiences: Array<{
    id: string;
    jobTitle: string;
    employer: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrentJob: boolean;
    description: string;
  }>;
  educations: Array<{
    id: string;
    schoolName: string;
    location: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    showLevel: boolean;
  }>;
  summary: string;
  /** See resumeDesignSchema in lib/schemas/resume-data.ts. */
  design?: {
    fontFamily: string;
    fontSize: number;
    sectionSpacing: number;
    paragraphSpacing: number;
    lineSpacing: number;
    color: string;
    showPhoto: boolean;
  };
  sectionOrder?: Array<
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "languages"
    | "certifications"
    | "awards"
    | "websites"
    | "references"
    | "hobbies"
    | "custom"
  >;
  finalize: {
    languages: Array<{
      id: string;
      name: string;
      proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
    }>;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
    }>;
    awards: Array<{
      id: string;
      title: string;
      issuer: string;
      date: string;
    }>;
    websites: Array<{
      id: string;
      label: string;
      url: string;
    }>;
    references: Array<{
      id: string;
      name: string;
      position: string;
      company: string;
      email: string;
      phone: string;
    }>;
    hobbies: Array<{
      id: string;
      name: string;
    }>;
    customSections: Array<{
      id: string;
      sectionName: string;
      description: string;
    }>;
  };
}

// Relations
export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

// Add resumes relation to users
export const usersResumeRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
}));
