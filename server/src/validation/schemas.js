import { z } from 'zod'

// Reading source enum
export const ReadingSource = {
  MANUAL: 'MANUAL',
  SENSOR: 'SENSOR',
  SIMULATOR: 'SIMULATOR',
}

// Reading input validation schema
export const readingSchema = z.object({
  farmId: z.string().min(1, 'farmId is required'),
  soilEC: z.number()
    .min(0, 'soilEC must be >= 0')
    .max(50, 'soilEC too high (max 50 dS/m)'),
  groundwaterEC: z.number()
    .min(0, 'groundwaterEC must be >= 0')
    .max(50, 'groundwaterEC too high'),
  tds: z.number()
    .min(0, 'tds must be >= 0')
    .max(50000, 'tds too high (max 50000 ppm)'),
  soilPH: z.number()
    .min(3, 'soilPH must be >= 3')
    .max(11, 'soilPH must be <= 11'),
  moisture: z.number()
    .min(0, 'moisture must be >= 0%')
    .max(100, 'moisture must be <= 100%'),
  waterLevel: z.number()
    .min(0, 'waterLevel must be >= 0')
    .max(50, 'waterLevel too high'),
  source: z.enum(['MANUAL', 'SENSOR', 'SIMULATOR']).default('MANUAL'),
  timestamp: z.string().optional(),
})

// Farm creation/update schema
export const farmSchema = z.object({
  farmName: z.string().min(1),
  farmerName: z.string().min(1),
  district: z.string().min(1),
  location: z.string().min(1),
  landArea: z.number().positive(),
  currentCrop: z.string().min(1),
  soilType: z.string().min(1),
  irrigationSource: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  userId: z.string().optional(),
})

// Chat query schema
export const chatSchema = z.object({
  farmId: z.string().min(1),
  question: z.string().min(1).max(500),
  language: z.enum(['en', 'hi', 'gu']).default('en'),
})
