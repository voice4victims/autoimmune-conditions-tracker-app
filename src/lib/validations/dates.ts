import { z } from 'zod'

// Enhanced date validation with timezone handling
export const dateSchema = z.union([
  z.date(),
  z.string().datetime({ precision: 3 }),
  z.string().date(),
]).transform((val) => {
  if (val instanceof Date) return val
  return new Date(val)
}).refine(
  (date) => !isNaN(date.getTime()),
  { message: 'Invalid date format' }
)

// Future date validation
export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
)

// Past date validation
export const pastDateSchema = dateSchema.refine(
  (date) => date < new Date(),
  { message: 'Date must be in the past' }
)

// Duration validation (in various formats)
export const durationSchema = z.union([
  z.number().positive(), // milliseconds
  z.string().regex(/^\d+[smhd]$/, 'Duration must be in format: 30s, 5m, 2h, 1d'),
]).transform((val) => {
  if (typeof val === 'number') return val
  
  const unit = val.slice(-1)
  const value = parseInt(val.slice(0, -1))
  
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return value * multipliers[unit as keyof typeof multipliers]
})