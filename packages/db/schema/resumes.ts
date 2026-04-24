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
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type for the JSON resume data stored in the database
export interface ResumeDataJSON {
  contact: {
    firstName: string;
    lastName: string;
    desiredJobTitle: string;
    phone: string;
    email: string;
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
