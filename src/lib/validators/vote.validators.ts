import { z } from "zod";

/**
 * Schema for validating tour ID parameter in vote endpoints
 */
export const votesTourIdSchema = z.string().uuid("Invalid tour ID format");
