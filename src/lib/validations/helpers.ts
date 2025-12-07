import { z } from 'zod'

// Custom error types
export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string>
  public readonly zodError: z.ZodError

  constructor(zodError: z.ZodError) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.zodError = zodError
    this.fieldErrors = getFieldErrors(zodError)
  }
}

// Enhanced validation utilities
export const validateAndTransform = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: ValidationError } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: new ValidationError(result.error) }
}

export const getFieldErrors = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = err.message
    }
  })
  
  return fieldErrors
}

// Form validation with field-level errors
export const createFormValidator = <T extends z.ZodTypeAny>(schema: T) => {
  return {
    validate: (data: unknown) => validateAndTransform(schema, data),
    validateField: (fieldName: string, value: unknown) => {
      try {
        const fieldSchema = schema.shape?.[fieldName] || schema
        const result = fieldSchema.safeParse(value)
        return result.success ? null : result.error.errors[0]?.message || 'Invalid value'
      } catch {
        return 'Validation error'
      }
    },
    getInitialErrors: (): Record<string, string> => ({}),
  }
}