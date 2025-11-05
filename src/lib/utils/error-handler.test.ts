import { describe, it, expect } from "vitest";
import { handleDatabaseError } from "./error-handler";
import { POSTGRES_ERROR_CODES } from "@/lib/constants/database";

describe("handleDatabaseError", () => {
  it("should handle unique violation error", () => {
    const error = { code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(409);
    expect(result.message).toBe("Email is already taken");
  });

  it("should handle foreign key violation error", () => {
    const error = { code: POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(400);
    expect(result.message).toBe("Referenced record does not exist");
  });

  it("should handle not null violation error", () => {
    const error = { code: POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(400);
    expect(result.message).toBe("Required field is missing");
  });

  it("should handle check violation error", () => {
    const error = { code: POSTGRES_ERROR_CODES.CHECK_VIOLATION };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(400);
    expect(result.message).toBe("Invalid data provided");
  });

  it("should handle unknown database error code", () => {
    const error = { code: "99999" };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });

  it("should handle error without code property", () => {
    const error = { message: "Something went wrong" };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });

  it("should handle null error", () => {
    const result = handleDatabaseError(null);

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });

  it("should handle undefined error", () => {
    const result = handleDatabaseError(undefined);

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });

  it("should handle string error", () => {
    const result = handleDatabaseError("Some error string");

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });

  it("should handle Error instance", () => {
    const error = new Error("Database connection failed");
    const result = handleDatabaseError(error);

    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal Server Error");
  });
});
