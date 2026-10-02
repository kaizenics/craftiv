import { createTRPCRouter } from "./init";
import { aiRouter } from "./routers/ai";
import { coverLetterRouter } from "./routers/coverLetter";
import { jobHunterRouter } from "./routers/jobHunter";
import { ownAiRouter } from "./routers/ownAi";
import { resumeRouter } from "./routers/resume";
import { resumeSnapshotRouter } from "./routers/resumeSnapshot";
import { userRouter } from "./routers/user";

/**
 * Root tRPC Router
 * All sub-routers are merged here
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  resume: resumeRouter,
  resumeSnapshot: resumeSnapshotRouter,
  coverLetter: coverLetterRouter,
  jobHunter: jobHunterRouter,
  ai: aiRouter,
  ownAi: ownAiRouter,
});

export type AppRouter = typeof appRouter;
