import { z } from 'zod';

// ===== Nano Banana Schemas =====

export const AspectRatioSchema = z.enum(['16:9', '1:1', '9:16']);
export const VideoStyleSchema = z.enum(['None', 'Cinematic', 'Scribble', 'Film-noir']);
export const GenreSchema = z.enum(['Drama', 'Comedy', 'Action', 'Horror', 'Sci-Fi', 'Romance']);
export const ToneSchema = z.enum(['Serious', 'Playful', 'Dark', 'Light', 'Epic', 'Intimate']);
export const FormatSchema = z.enum(['Custom', 'Short Film', 'Commercial']);

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
});

export const SceneConfigSchema = z.object({
  sceneName: z.string().min(1, 'Scene name is required'),
  location: z.string().min(1, 'Location is required'),
  lighting: z.string(),
  weather: z.string(),
  sceneDescription: z.string().max(2000, 'Description must be under 2000 characters'),
  voiceover: z.string().optional(),
  aspectRatio: AspectRatioSchema,
  videoStyle: VideoStyleSchema,
  styleReference: z.string().optional(),
  cinematicInspiration: z.string().optional(),
  cast: z.array(CharacterSchema),
  specialRequests: z.string().optional(),
  format: FormatSchema,
  customFormat: z.string().optional(),
  genre: GenreSchema.optional(),
  tone: ToneSchema.optional(),
  addVoiceover: z.boolean().default(false),
});

export const ProjectStateSchema = z.object({
  projectName: z.string().default('Untitled Project'),
  aspectRatio: AspectRatioSchema.default('16:9'),
  cast: z.array(CharacterSchema).default([]),
  assets: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// ===== AdBanana Schemas =====

export const PlatformSchema = z.enum(['tiktok', 'instagram_reels', 'youtube_shorts']);
export const ObjectiveSchema = z.enum(['awareness', 'traffic', 'conversion']);
export const AdToneSchema = z.enum(['playful', 'bold', 'authoritative', 'friendly', 'luxury']);

export const AdBriefSchema = z.object({
  brand: z.string().min(1, 'Brand name is required'),
  product: z.string().min(1, 'Product name is required'),
  valueProp: z.string().min(1, 'Value proposition is required'),
  audience: z.string().min(1, 'Target audience is required'),
  objective: ObjectiveSchema,
  platform: PlatformSchema,
  durationSec: z.number().min(6).max(60),
  briefContext: z.string().optional(),
  sensitiveClaims: z.boolean().default(false),
});

export const AdBeatSchema = z.object({
  tStart: z.number().min(0),
  tEnd: z.number().min(0),
  voiceover: z.string().optional(),
  onScreenText: z.string().optional(),
  overlay: z.array(z.string()).default([]),
  shotNotes: z.string().optional(),
});

export const AdScriptSchema = z.object({
  hook: z.string(),
  beats: z.array(AdBeatSchema),
  cta: z.string(),
  captions: z.string(),
  hashtags: z.array(z.string()),
  complianceNotes: z.array(z.string()),
});

export const AdVariantSchema = z.object({
  id: z.string(),
  tone: AdToneSchema.optional(),
  hookRewrite: z.string().optional(),
  ctaRewrite: z.string().optional(),
  platform: PlatformSchema.optional(),
  script: AdScriptSchema,
});

export const AdPackageSchema = z.object({
  brief: AdBriefSchema,
  baseScript: AdScriptSchema,
  variants: z.array(AdVariantSchema),
});

// Type exports
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type VideoStyle = z.infer<typeof VideoStyleSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type SceneConfig = z.infer<typeof SceneConfigSchema>;
export type ProjectState = z.infer<typeof ProjectStateSchema>;

export type Platform = z.infer<typeof PlatformSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type AdTone = z.infer<typeof AdToneSchema>;
export type AdBrief = z.infer<typeof AdBriefSchema>;
export type AdBeat = z.infer<typeof AdBeatSchema>;
export type AdScript = z.infer<typeof AdScriptSchema>;
export type AdVariant = z.infer<typeof AdVariantSchema>;
export type AdPackage = z.infer<typeof AdPackageSchema>;

// Platform-specific constraints
export const PLATFORM_CONSTRAINTS = {
  tiktok: {
    maxCaptionLength: 150,
    safeAreaPercent: 0.8,
    recommendedDurations: [6, 15, 30],
  },
  instagram_reels: {
    maxCaptionLength: 2200,
    safeAreaPercent: 0.85,
    recommendedDurations: [15, 30, 60],
  },
  youtube_shorts: {
    maxCaptionLength: 100,
    safeAreaPercent: 0.9,
    recommendedDurations: [15, 30, 60],
  },
} as const;