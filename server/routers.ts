import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  getProfileByUserId, 
  upsertProfile, 
  getResumeByUserId, 
  upsertResume,
  getNextJobForUser,
  createSwipe,
  createApplication,
  getSwipesByUserId,
  getApplicationsByUserId,
  getLatestSwipeByUserId,
  undoSwipe,
  cancelApplicationBySwipeId,
  createJob,
  getAllJobs,
  getJobById
} from "./db";
import { storagePut } from "./storage";
import { matchCandidateToJob } from "./ai/matchCandidate";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      const resume = await getResumeByUserId(ctx.user.id);
      return {
        profile,
        resume
      };
    }),

    update: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        minSalary: z.number().optional(),
        maxSalary: z.number().optional(),
        currency: z.string().optional(),
        experienceYears: z.number().optional(),
        currentRoleTitle: z.string().optional(),
        desiredTitle: z.string().optional(),
        workModePreferences: z.array(z.string()).optional(),
        perksPreferences: z.record(z.string(), z.boolean()).optional(),
        skills: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileData = {
          userId: ctx.user.id,
          ...input,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          workModePreferences: input.workModePreferences as string[] | null | undefined,
          perksPreferences: input.perksPreferences as Record<string, boolean> | null | undefined,
          skills: input.skills as string[] | null | undefined,
        };
        const profile = await upsertProfile(profileData);
        return profile;
      }),
  }),

  resume: router({
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
        parsedText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.base64Data, 'base64');
        const fileKey = `resumes/${ctx.user.id}/${nanoid()}-${input.filename}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save resume metadata to database
        const resume = await upsertResume({
          userId: ctx.user.id,
          fileUrl: url,
          fileKey: fileKey,
          originalFilename: input.filename,
          mimeType: input.mimeType,
          parsedText: input.parsedText || null,
          parsedAt: input.parsedText ? new Date() : null,
        });

        return resume;
      }),
  }),

  swipe: router({
    next: protectedProcedure.query(async ({ ctx }) => {
      // Get user's profile and resume
      const profile = await getProfileByUserId(ctx.user.id);
      const resume = await getResumeByUserId(ctx.user.id);

      if (!profile) {
        throw new Error("Please complete your profile first");
      }

      // Get next job based on preferences
      const job = await getNextJobForUser(ctx.user.id);

      if (!job) {
        return {
          job: null,
          aiMatch: null
        };
      }

      // Run AI matching
      let aiMatch = null;
      if (resume?.parsedText) {
        try {
          aiMatch = await matchCandidateToJob({
            resumeText: resume.parsedText,
            profile,
            job
          });
        } catch (error) {
          console.error("AI matching error:", error);
          aiMatch = {
            qualified: false,
            reason: "Unable to analyze qualification at this time"
          };
        }
      } else {
        aiMatch = {
          qualified: false,
          reason: "Please upload your resume to get AI matching results"
        };
      }

      return {
        job: {
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          companyLogoUrl: job.companyLogoUrl,
          city: job.city,
          country: job.country,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          workMode: job.workMode,
          employmentType: job.employmentType,
          summary: job.summary,
          description: job.description,
          perks: job.perks,
          applyUrl: job.applyUrl,
        },
        aiMatch
      };
    }),

    decision: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        decision: z.enum(["like", "dislike"]),
        aiQualified: z.boolean().optional(),
        aiReason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create swipe record
        const swipeId = await createSwipe({
          userId: ctx.user.id,
          jobId: input.jobId,
          decision: input.decision,
          qualifiedFlag: input.aiQualified ?? null,
          qualifiedReason: input.aiReason ?? null,
        });

        // If liked, create application
        if (input.decision === "like") {
          await createApplication({
            userId: ctx.user.id,
            jobId: input.jobId,
            swipeId: swipeId,
            status: "queued",
          });
        }

        return { ok: true };
      }),

    undo: protectedProcedure.mutation(async ({ ctx }) => {
      // Get the latest swipe
      const latestSwipe = await getLatestSwipeByUserId(ctx.user.id);

      if (!latestSwipe) {
        throw new Error("No swipe to undo");
      }

      // Mark swipe as undone
      await undoSwipe(latestSwipe.id);

      // Cancel associated application if it exists
      await cancelApplicationBySwipeId(latestSwipe.id);

      return { 
        ok: true,
        swipeId: latestSwipe.id 
      };
    }),
  }),

  history: router({
    swipes: protectedProcedure
      .input(z.object({
        decision: z.enum(["like", "dislike"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const swipes = await getSwipesByUserId(ctx.user.id, input?.decision);
        return swipes;
      }),

    applications: protectedProcedure.query(async ({ ctx }) => {
      const applications = await getApplicationsByUserId(ctx.user.id);
      return applications;
    }),
  }),

  admin: router({
    createJob: protectedProcedure
      .input(z.object({
        externalId: z.string().optional(),
        title: z.string(),
        companyName: z.string(),
        companyLogoUrl: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        currency: z.string().optional(),
        workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
        employmentType: z.string().optional(),
        summary: z.string().optional(),
        description: z.string().optional(),
        perks: z.record(z.string(), z.boolean()).optional(),
        applyUrl: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admins can create jobs
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const jobData = {
          ...input,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          perks: input.perks as Record<string, boolean> | null | undefined,
        };

        const jobId = await createJob(jobData);
        return { jobId };
      }),

    listJobs: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // Only admins can list all jobs
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const jobs = await getAllJobs(input?.limit);
        return jobs;
      }),

    getJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // Only admins can view job details
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const job = await getJobById(input.jobId);
        return job;
      }),
  }),
});

export type AppRouter = typeof appRouter;
