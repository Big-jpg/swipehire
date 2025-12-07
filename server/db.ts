import { eq, and, isNull, desc, sql, or, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, resumes, jobs, swipes, applications, InsertProfile, InsertResume, InsertJob, InsertSwipe, InsertApplication } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Profile queries
export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertProfile(data: InsertProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getProfileByUserId(data.userId);
  
  if (existing) {
    await db.update(profiles).set(data).where(eq(profiles.userId, data.userId));
    return getProfileByUserId(data.userId);
  } else {
    await db.insert(profiles).values(data);
    return getProfileByUserId(data.userId);
  }
}

// Resume queries
export async function getResumeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resumes).where(eq(resumes.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertResume(data: InsertResume) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getResumeByUserId(data.userId);
  
  if (existing) {
    await db.update(resumes).set(data).where(eq(resumes.userId, data.userId));
    return getResumeByUserId(data.userId);
  } else {
    await db.insert(resumes).values(data);
    return getResumeByUserId(data.userId);
  }
}

// Job queries
export async function createJob(data: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(jobs).values(data);
  // Return the created job by querying back
  const result = await db.select().from(jobs).where(eq(jobs.externalId, data.externalId || '')).limit(1);
  return result[0]?.id || 0;
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllJobs(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
}

// Swipe queries
export async function createSwipe(data: InsertSwipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(swipes).values(data);
  // Get the latest swipe for this user/job combination
  const result = await db.select().from(swipes)
    .where(and(eq(swipes.userId, data.userId), eq(swipes.jobId, data.jobId)))
    .orderBy(desc(swipes.createdAt))
    .limit(1);
  return result[0]?.id || 0;
}

export async function getSwipesByUserId(userId: number, decision?: "like" | "dislike") {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(swipes.userId, userId),
    isNull(swipes.undoneAt)
  ];

  if (decision) {
    conditions.push(eq(swipes.decision, decision));
  }

  return db.select({
    swipe: swipes,
    job: jobs
  })
  .from(swipes)
  .leftJoin(jobs, eq(swipes.jobId, jobs.id))
  .where(and(...conditions))
  .orderBy(desc(swipes.createdAt));
}

export async function getLatestSwipeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(swipes)
    .where(and(
      eq(swipes.userId, userId),
      isNull(swipes.undoneAt)
    ))
    .orderBy(desc(swipes.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function undoSwipe(swipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(swipes)
    .set({ undoneAt: new Date() })
    .where(eq(swipes.id, swipeId));
}

export async function getSwipedJobIds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ jobId: swipes.jobId })
    .from(swipes)
    .where(and(
      eq(swipes.userId, userId),
      isNull(swipes.undoneAt)
    ));

  return result.map(r => r.jobId);
}

// Application queries
export async function createApplication(data: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(applications).values(data);
  // Get the latest application for this user/job combination
  const result = await db.select().from(applications)
    .where(and(eq(applications.userId, data.userId), eq(applications.jobId, data.jobId)))
    .orderBy(desc(applications.createdAt))
    .limit(1);
  return result[0]?.id || 0;
}

export async function getApplicationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    application: applications,
    job: jobs
  })
  .from(applications)
  .leftJoin(jobs, eq(applications.jobId, jobs.id))
  .where(eq(applications.userId, userId))
  .orderBy(desc(applications.createdAt));
}

export async function updateApplicationStatus(applicationId: number, status: "queued" | "submitted" | "failed", failureReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "submitted") {
    updateData.submittedAt = new Date();
  }
  if (failureReason) {
    updateData.failureReason = failureReason;
  }

  await db.update(applications)
    .set(updateData)
    .where(eq(applications.id, applicationId));
}

export async function cancelApplicationBySwipeId(swipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(applications)
    .set({ status: "failed", failureReason: "Swipe undone by user" })
    .where(eq(applications.swipeId, swipeId));
}

// Get next job for swipe feed with filtering
export async function getNextJobForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Get user profile and already swiped job IDs
  const profile = await getProfileByUserId(userId);
  const swipedJobIds = await getSwipedJobIds(userId);

  // Build filter conditions
  const conditions = [];

  // Exclude already swiped jobs
  if (swipedJobIds.length > 0) {
    conditions.push(sql`${jobs.id} NOT IN (${sql.join(swipedJobIds.map(id => sql`${id}`), sql`, `)})`);
  }

  // Filter by profile preferences if profile exists
  if (profile) {
    // Location filter (city or country match)
    if (profile.city || profile.country) {
      const locationConditions = [];
      if (profile.city) locationConditions.push(eq(jobs.city, profile.city));
      if (profile.country) locationConditions.push(eq(jobs.country, profile.country));
      if (locationConditions.length > 0) {
        conditions.push(or(...locationConditions));
      }
    }

    // Salary range overlap
    if (profile.minSalary !== null && profile.minSalary !== undefined) {
      conditions.push(
        or(
          isNull(jobs.salaryMax),
          gte(jobs.salaryMax, profile.minSalary)
        )
      );
    }
    if (profile.maxSalary !== null && profile.maxSalary !== undefined) {
      conditions.push(
        or(
          isNull(jobs.salaryMin),
          lte(jobs.salaryMin, profile.maxSalary)
        )
      );
    }

    // Work mode preferences
    if (profile.workModePreferences && Array.isArray(profile.workModePreferences) && profile.workModePreferences.length > 0) {
      conditions.push(
        or(
          isNull(jobs.workMode),
          inArray(jobs.workMode, profile.workModePreferences as any)
        )
      );
    }
  }

  // Get one job matching all conditions
  const query = conditions.length > 0
    ? db.select().from(jobs).where(and(...conditions)).limit(1)
    : db.select().from(jobs).limit(1);

  const result = await query;
  return result.length > 0 ? result[0] : undefined;
}
