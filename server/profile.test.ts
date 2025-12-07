// server/profile.test.ts
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

describe("profile.update", () => {
  it("should update user profile with valid data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const profileData = {
      fullName: "John Doe",
      city: "San Francisco",
      country: "USA",
      minSalary: 100000,
      maxSalary: 150000,
      currency: "USD",
      experienceYears: 5,
      currentRoleTitle: "Software Engineer",
      desiredTitle: "Senior Software Engineer",
      workModePreferences: ["remote", "hybrid"],
      skills: ["JavaScript", "TypeScript", "React"],
    };

    const result = await caller.profile.update(profileData);

    expect(result).toBeDefined();
    expect(result?.fullName).toBe("John Doe");
    expect(result?.city).toBe("San Francisco");
    expect(result?.minSalary).toBe(100000);
  });

  it("should handle partial profile updates", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a profile
    await caller.profile.update({
      fullName: "Jane Smith",
      city: "New York",
      country: "USA",
    });

    // Then update only some fields
    const result = await caller.profile.update({
      city: "Boston",
      experienceYears: 3,
    });

    expect(result?.city).toBe("Boston");
    expect(result?.experienceYears).toBe(3);
  });
});

describe("profile.me", () => {
  it("should return profile and resume data for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.me();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("profile");
    expect(result).toHaveProperty("resume");
  });
});
