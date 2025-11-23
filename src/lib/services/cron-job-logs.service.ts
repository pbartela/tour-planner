import type { SupabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";
import { secureError } from "@/lib/server/logger.service";

type AdminClient = SupabaseClient<Database>;

export interface CronJobLogDto {
  id: number;
  job_name: string;
  execution_time: string;
  success: boolean;
  error_message: string | null;
  tours_archived: number | null;
  invitations_expired: number | null;
}

interface GetCronJobLogsOptions {
  limit?: number;
  jobName?: string;
}

/**
 * Service for inspecting cron_job_logs.
 *
 * This is intentionally admin-only and should only be called with a Supabase **admin client**
 * created via `createSupabaseAdminClient()` using the service role key. Never expose this
 * directly to the browser.
 *
 * Future improvements:
 * - Wire this into an admin dashboard UI for at-a-glance cron health
 * - Trigger alerting (email/Slack) on repeated failures
 * - Export metrics (e.g. to a /metrics endpoint) for observability tools
 */
export async function getRecentCronJobLogs(
  adminClient: AdminClient,
  { limit = 50, jobName }: GetCronJobLogsOptions = {},
): Promise<CronJobLogDto[]> {
  try {
    let query = adminClient
      .from("cron_job_logs")
      .select(
        "id, job_name, execution_time, success, error_message, tours_archived, invitations_expired",
      )
      .order("execution_time", { ascending: false })
      .limit(limit);

    if (jobName) {
      query = query.eq("job_name", jobName);
    }

    const { data, error } = await query;

    if (error) {
      secureError("Error fetching cron job logs", error);
      throw new Error("Failed to fetch cron job logs.");
    }

    return (data ?? []) as CronJobLogDto[];
  } catch (error) {
    secureError("Unexpected error in getRecentCronJobLogs", error);
    throw error instanceof Error ? error : new Error("An unexpected error occurred.");
  }
}


