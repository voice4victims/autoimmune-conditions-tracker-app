import { z } from 'zod'

// Custom error messages with i18n support
export const ERROR_MESSAGES = {
  email: {
    invalid: 'validation.email.invalid',
    required: 'validation.email.required',
  },
  password: {
    minLength: 'validation.password.minLength',
    uppercase: 'validation.password.uppercase',
    lowercase: 'validation.password.lowercase',
    number: 'validation.password.number',
    special: 'validation.password.special',
  },
  common: {
    required: 'validation.common.required',
    invalid: 'validation.common.invalid',
  },
} as const

// Enhanced email validation with more comprehensive checks
export const emailSchema = z
  .string({ required_error: ERROR_MESSAGES.email.required })
  .min(1, ERROR_MESSAGES.email.required)
  .email(ERROR_MESSAGES.email.invalid)
  .max(254, 'Email address too long') // RFC 5321 limit
  .refine(
    (email) => {
      // Check for common disposable email domains
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com']
      const domain = email.split('@')[1]?.toLowerCase()
      return !disposableDomains.includes(domain)
    },
    { message: 'Disposable email addresses are not allowed' }
  )