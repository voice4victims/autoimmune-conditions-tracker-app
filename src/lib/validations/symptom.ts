import { z } from 'zod'
import { uuidSchema } from './schemas'
import { dateSchema, futureDateSchema } from './dates'
import { coordinateSchema } from './location'
import { fileSchema } from './files'

// Enhanced symptom type with subcategories
export const symptomTypeSchema = z.enum(['behavioral', 'physical', 'emotional', 'cognitive', 'social'])

export const symptomSubtypeSchema = z.object({
  behavioral: z.enum(['repetitive', 'aggressive', 'self-stimulatory', 'social-avoidance']).optional(),
  physical: z.enum(['motor', 'sensory', 'gastrointestinal', 'sleep', 'pain']).optional(),
  emotional: z.enum(['anxiety', 'depression', 'irritability', 'mood-swing']).optional(),
  cognitive: z.enum(['focus', 'memory', 'processing', 'executive-function']).optional(),
  social: z.enum(['communication', 'interaction', 'relationship', 'isolation']).optional(),
})

// Severity with contextual descriptions
export const severityWithContextSchema = z.object({
  value: z.number().int().min(1).max(10),
  description: z.string().max(100).optional(),
  impactLevel: z.enum(['minimal', 'mild', 'moderate', 'severe', 'extreme']),
  functionalImpact: z.object({
    daily_activities: z.number().int().min(0).max(10),
    social_interaction: z.number().int().min(0).max(10),
    work_school: z.number().int().min(0).max(10),
    self_care: z.number().int().min(0).max(10),
  }).optional(),
})

// Enhanced trigger system with categories
export const triggerSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['environmental', 'social', 'dietary', 'schedule', 'sensory', 'emotional']),
  intensity: z.number().int().min(1).max(5).optional(),
  confidence: z.number().int().min(1).max(5).optional(), // How sure user is this was a trigger
})