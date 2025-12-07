import { z } from 'zod'
import { emailSchema } from './common'
import { createPasswordSchema } from './password'
import { phoneSchema } from './schemas'
import { pastDateSchema } from './dates'

// Enhanced signup with additional security features
export const enhancedSignUpSchema = z
  .object({
    email: emailSchema,
    password: createPasswordSchema({ requireSpecial: true }),
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(50, 'Full name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    acceptTerms: z.boolean().refine(val => val, 'You must accept the terms'),
    acceptPrivacy: z.boolean().refine(val => val, 'You must accept the privacy policy'),
    phoneNumber: phoneSchema.optional(),
    dateOfBirth: pastDateSchema.optional(),
    referralCode: z.string().optional(),
    captchaToken: z.string().min(1, 'Captcha verification required'),
    marketingOptIn: z.boolean().default(false),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    data => {
      // Age verification if DOB provided
      if (data.dateOfBirth) {
        const age = new Date().getFullYear() - data.dateOfBirth.getFullYear()
        return age >= 13 // COPPA compliance
      }
      return true
    },
    {
      message: 'You must be at least 13 years old to create an account',
      path: ['dateOfBirth'],
    }
  )

// Multi-factor authentication schemas
export const mfaSetupSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: phoneSchema.optional(),
  backupCodes: z.array(z.string()).length(10).optional(),
})

export const mfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  method: z.enum(['totp', 'sms', 'email', 'backup']),
  trustDevice: z.boolean().default(false),
})