// server/swipe.test.ts
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("swipe.next", () => {
  it("should require a profile to be created first", async () => {
    const ctx = createAuthContext(999); // User without profile
    const caller = appRouter.createCaller(ctx);

    await expect(caller.swipe.next()).rejects.toThrow("Please complete your profile first");
  });

  it("should return a job and AI match for users with profiles", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a profile first
    await caller.profile.update({
      fullName: "Test User",
      city: "San Francisco",
      country: "USA",
      minSalary: 100000,
      maxSalary: 150000,
      experienceYears: 5,
      desiredTitle: "Software Engineer",
      workModePreferences: ["remote", "hybrid"],
      skills: ["JavaScript", "React"],
    });

    const result = await caller.swipe.next();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("job");
    expect(result).toHaveProperty("aiMatch");
  });
});

describe("swipe.decision", () => {
  it("should record a swipe decision", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Setup: Create profile and get a job
    await caller.profile.update({
      fullName: "Test User",
      city: "San Francisco",
      country: "USA",
      workModePreferences: ["remote"],
    });

    const nextJob = await caller.swipe.next();
    
    if (nextJob.job) {
      const result = await caller.swipe.decision({
        jobId: nextJob.job.id,
        decision: "like",
        aiQualified: true,
        aiReason: "Good match",
      });

      expect(result.ok).toBe(true);
    }
  });

  it("should create an application when decision is like", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Setup profile
    await caller.profile.update({
      fullName: "Test User",
      city: "San Francisco",
      country: "USA",
      workModePreferences: ["remote"],
    });

    const nextJob = await caller.swipe.next();
    
    if (nextJob.job) {
      await caller.swipe.decision({
        jobId: nextJob.job.id,
        decision: "like",
      });

      // Check that application was created
      const applications = await caller.history.applications();
      expect(applications.length).toBeGreaterThan(0);
    }
  });
});

describe("swipe.undo", () => {
  it("should undo the last swipe", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Setup profile
    await caller.profile.update({
      fullName: "Test User",
      city: "San Francisco",
      country: "USA",
      workModePreferences: ["remote"],
    });

    const nextJob = await caller.swipe.next();
    
    if (nextJob.job) {
      // Make a decision
      await caller.swipe.decision({
        jobId: nextJob.job.id,
        decision: "like",
      });

      // Undo it
      const result = await caller.swipe.undo();
      expect(result.ok).toBe(true);
      expect(result.swipeId).toBeDefined();
    }
  });

  it("should throw error when no swipe to undo", async () => {
    const ctx = createAuthContext(998);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.swipe.undo()).rejects.toThrow("No swipe to undo");
  });
});
