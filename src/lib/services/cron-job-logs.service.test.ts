import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecentCronJobLogs, type CronJobLogDto } from "./cron-job-logs.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";

type AdminClient = SupabaseClient<Database>;

describe("CronJobLogsService", () => {
  let mockAdminClient: AdminClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminClient = {
      from: vi.fn(),
    } as unknown as AdminClient;
  });

  const mockLogData: CronJobLogDto[] = [
    {
      id: 1,
      job_name: "auto_archive_tours",
      execution_time: "2025-01-15T10:00:00Z",
      success: true,
      error_message: null,
      tours_archived: 5,
      invitations_expired: null,
    },
    {
      id: 2,
      job_name: "expire_invitations",
      execution_time: "2025-01-15T09:00:00Z",
      success: true,
      error_message: null,
      tours_archived: null,
      invitations_expired: 10,
    },
    {
      id: 3,
      job_name: "auto_archive_tours",
      execution_time: "2025-01-14T10:00:00Z",
      success: false,
      error_message: "Database connection timeout",
      tours_archived: 0,
      invitations_expired: null,
    },
  ];

  const setupMockQuery = (data: CronJobLogDto[] | null, error: { message?: string } | null) => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockReturnThis();
    const mockEq = vi.fn();

    // Chain setup
    (mockAdminClient.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    // If eq is called (for filtering by job name), return the final result
    mockLimit.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockResolvedValue({ data, error });

    // If eq is NOT called, limit returns the result directly
    mockLimit.mockResolvedValue({ data, error });

    return { mockSelect, mockOrder, mockLimit, mockEq };
  };

  describe("getRecentCronJobLogs", () => {
    it("should fetch recent cron job logs with default options", async () => {
      setupMockQuery(mockLogData, null);

      const result = await getRecentCronJobLogs(mockAdminClient);

      expect(result).toEqual(mockLogData);
      expect(mockAdminClient.from).toHaveBeenCalledWith("cron_job_logs");
    });

    it("should apply default limit of 50", async () => {
      const { mockLimit } = setupMockQuery(mockLogData, null);

      await getRecentCronJobLogs(mockAdminClient);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("should apply custom limit", async () => {
      const { mockLimit } = setupMockQuery(mockLogData.slice(0, 2), null);

      await getRecentCronJobLogs(mockAdminClient, { limit: 10 });

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it("should filter by job name when provided", async () => {
      const filteredData = mockLogData.filter((log) => log.job_name === "auto_archive_tours");

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: filteredData, error: null });

      (mockAdminClient.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        eq: mockEq,
      });

      const result = await getRecentCronJobLogs(mockAdminClient, { jobName: "auto_archive_tours" });

      expect(result).toEqual(filteredData);
      expect(mockEq).toHaveBeenCalledWith("job_name", "auto_archive_tours");
    });

    it("should order by execution_time descending", async () => {
      const { mockOrder } = setupMockQuery(mockLogData, null);

      await getRecentCronJobLogs(mockAdminClient);

      expect(mockOrder).toHaveBeenCalledWith("execution_time", { ascending: false });
    });

    it("should select correct fields", async () => {
      const { mockSelect } = setupMockQuery(mockLogData, null);

      await getRecentCronJobLogs(mockAdminClient);

      expect(mockSelect).toHaveBeenCalledWith(
        "id, job_name, execution_time, success, error_message, tours_archived, invitations_expired"
      );
    });

    it("should return empty array when no logs exist", async () => {
      setupMockQuery([], null);

      const result = await getRecentCronJobLogs(mockAdminClient);

      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      setupMockQuery(null, null);

      const result = await getRecentCronJobLogs(mockAdminClient);

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      setupMockQuery(null, { message: "Database error" });

      await expect(getRecentCronJobLogs(mockAdminClient)).rejects.toThrow("Failed to fetch cron job logs.");
    });

    it("should apply both limit and jobName filters", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockLogData.slice(0, 1), error: null });

      (mockAdminClient.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        eq: mockEq,
      });

      await getRecentCronJobLogs(mockAdminClient, { limit: 5, jobName: "auto_archive_tours" });

      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(mockEq).toHaveBeenCalledWith("job_name", "auto_archive_tours");
    });
  });

  describe("CronJobLogDto type", () => {
    it("should have all required fields", () => {
      const log: CronJobLogDto = {
        id: 1,
        job_name: "test_job",
        execution_time: "2025-01-15T10:00:00Z",
        success: true,
        error_message: null,
        tours_archived: null,
        invitations_expired: null,
      };

      expect(log.id).toBe(1);
      expect(log.job_name).toBe("test_job");
      expect(log.execution_time).toBe("2025-01-15T10:00:00Z");
      expect(log.success).toBe(true);
      expect(log.error_message).toBeNull();
      expect(log.tours_archived).toBeNull();
      expect(log.invitations_expired).toBeNull();
    });

    it("should allow error_message when success is false", () => {
      const log: CronJobLogDto = {
        id: 1,
        job_name: "test_job",
        execution_time: "2025-01-15T10:00:00Z",
        success: false,
        error_message: "Something went wrong",
        tours_archived: 0,
        invitations_expired: null,
      };

      expect(log.success).toBe(false);
      expect(log.error_message).toBe("Something went wrong");
    });
  });
});

