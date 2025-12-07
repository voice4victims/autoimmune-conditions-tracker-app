import { z } from 'zod'

// Enhanced UUID validation with version checking
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')
  .refine(
    (uuid) => {
      // Check for UUID v4 (random) format specifically
      const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      return uuidV4Regex.test(uuid)
    },
    { message: 'Only UUID v4 format is accepted' }
  )

// Enhanced pagination with cursor support
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().optional(), // For cursor-based pagination
  search: z.string().max(100).optional(),
  filters: z.record(z.string(), z.any()).optional(),
})

// Enhanced API response schema with metadata
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().nullable(),
    message: z.string().optional(),
    meta: z.object({
      timestamp: z.string().datetime(),
      requestId: z.string().uuid(),
      version: z.string(),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }).optional(),
    }).optional(),
  })

// Phone number validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/[\s\-\(\)]/g, ''))