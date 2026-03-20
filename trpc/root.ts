import { createTRPCRouter } from "./init";
import { aiRouter } from "./routers/ai";
import { resumeRouter } from "./routers/resume";
import { userRouter } from "./routers/user";

/**
 * Root tRPC Router
 * All sub-routers are merged here
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  resume: resumeRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
