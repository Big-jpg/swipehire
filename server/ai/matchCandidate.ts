import { invokeLLM } from "../_core/llm";
import type { Profile, Job } from "../../drizzle/schema";

export type MatchResult = {
  qualified: boolean;
  reason: string;
};

export async function matchCandidateToJob(params: {
  resumeText: string;
  profile: Profile;
  job: Job;
}): Promise<MatchResult> {
  const { resumeText, profile, job } = params;

  // Build a comprehensive prompt for the LLM
  const systemPrompt = `You are an expert job matching assistant. Your task is to analyze whether a candidate is qualified for a specific job based on their resume, profile, and the job requirements.

Return ONLY a JSON object with this exact structure:
{
  "qualified": true or false,
  "reason": "A brief 1-2 sentence explanation of why they are or aren't qualified"
}

Be objective and focus on:
- Required skills and experience match
- Years of experience alignment
- Location compatibility
- Salary expectations alignment
- Work mode preferences`;

  const userPrompt = `Candidate Profile:
- Name: ${profile.fullName || 'Not provided'}
- Location: ${profile.city || 'Unknown'}, ${profile.country || 'Unknown'}
- Experience: ${profile.experienceYears || 0} years
- Current Role: ${profile.currentRoleTitle || 'Not specified'}
- Desired Role: ${profile.desiredTitle || 'Not specified'}
- Skills: ${profile.skills && Array.isArray(profile.skills) ? profile.skills.join(', ') : 'Not specified'}
- Salary Range: ${profile.currency || 'USD'} ${profile.minSalary || 0} - ${profile.maxSalary || 0}
- Work Mode Preferences: ${profile.workModePreferences && Array.isArray(profile.workModePreferences) ? profile.workModePreferences.join(', ') : 'Any'}

Resume:
${resumeText || 'No resume text available'}

Job Details:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.city || 'Unknown'}, ${job.country || 'Unknown'}
- Salary: ${job.currency || 'USD'} ${job.salaryMin || 0} - ${job.salaryMax || 0}
- Work Mode: ${job.workMode || 'Not specified'}
- Employment Type: ${job.employmentType || 'full-time'}
- Summary: ${job.summary || 'Not provided'}
- Description: ${job.description || 'Not provided'}

Is this candidate qualified for this job?`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_match_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              qualified: {
                type: "boolean",
                description: "Whether the candidate is qualified for the job"
              },
              reason: {
                type: "string",
                description: "Brief explanation of the qualification decision"
              }
            },
            required: ["qualified", "reason"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr) as MatchResult;
    
    // Validate the result
    if (typeof result.qualified !== 'boolean' || typeof result.reason !== 'string') {
      throw new Error("Invalid response format from LLM");
    }

    return result;
  } catch (error) {
    console.error("[AI Match] Error matching candidate to job:", error);
    // Fallback response
    return {
      qualified: false,
      reason: "Unable to determine fit due to technical error. Please try again."
    };
  }
}
