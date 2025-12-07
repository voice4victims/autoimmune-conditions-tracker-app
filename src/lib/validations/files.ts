import { z } from 'zod'

// URL validation with protocol checking
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  )

// File validation schema
export const fileSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  type: z.string().min(1),
  lastModified: z.number().optional(),
})

// Enhanced file validation with size and type constraints
export const createFileSchema = (options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  maxFiles?: number
} = {}) => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], maxFiles = 1 } = options

  const singleFileSchema = fileSchema
    .refine(
      (file) => file.size <= maxSize,
      { message: `File size must not exceed ${Math.round(maxSize / (1024 * 1024))}MB` }
    )
    .refine(
      (file) => allowedTypes.length === 0 || allowedTypes.includes(file.type),
      { message: `File type must be one of: ${allowedTypes.join(', ')}` }
    )

  return maxFiles === 1 
    ? singleFileSchema 
    : z.array(singleFileSchema).max(maxFiles, `Maximum ${maxFiles} files allowed`)
}

// Color validation (hex, rgb, hsl)
export const colorSchema = z.string().refine(
  (color) => {
    const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
    const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/
    return hexRegex.test(color) || rgbRegex.test(color) || hslRegex.test(color)
  },
  { message: 'Invalid color format. Use hex (#123456), rgb(r,g,b), or hsl(h,s%,l%)' }
)