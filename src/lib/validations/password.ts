import { z } from 'zod'
import { ERROR_MESSAGES } from './common'

// Enhanced password validation with configurable requirements
export const createPasswordSchema = (options: {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSpecial?: boolean
  maxLength?: number
} = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
    maxLength = 128,
  } = options

  let schema = z
    .string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .max(maxLength, `Password cannot exceed ${maxLength} characters`)

  if (requireUppercase) {
    schema = schema.regex(/[A-Z]/, ERROR_MESSAGES.password.uppercase)
  }
  if (requireLowercase) {
    schema = schema.regex(/[a-z]/, ERROR_MESSAGES.password.lowercase)
  }
  if (requireNumber) {
    schema = schema.regex(/[0-9]/, ERROR_MESSAGES.password.number)
  }
  if (requireSpecial) {
    schema = schema.regex(/[^A-Za-z0-9]/, ERROR_MESSAGES.password.special)
  }

  return schema.refine(
    (password) => {
      // Check against common weak passwords
      const weakPasswords = ['password123', '12345678', 'qwerty123']
      return !weakPasswords.includes(password.toLowerCase())
    },
    { message: 'Password is too common, please choose a stronger password' }
  )
}

export const passwordSchema = createPasswordSchema()