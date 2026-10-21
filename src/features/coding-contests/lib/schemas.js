import { z } from 'zod';
import { MAX_SOURCE_BYTES } from './constants.js';

export const createContestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20000).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  scoring_mode: z.enum(['icpc', 'points']).optional(),
  stop_on_first_fail: z.boolean().optional(),
  ignore_ce_penalty: z.boolean().optional(),
  wrong_penalty_minutes: z.number().int().min(0).max(120).optional(),
  starts_at: z.union([z.string().min(1), z.literal(''), z.null()]).optional(),
  ends_at: z.union([z.string().min(1), z.literal(''), z.null()]).optional(),
});

export const updateContestSchema = createContestSchema.partial();

export const problemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(80).optional().nullable(),
  statement: z.string().max(200000).optional().nullable(),
  points: z.number().int().min(0).max(100000).optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  cpu_time_limit: z.number().min(0.1).max(10).optional(),
  wall_time_limit: z.number().min(1).max(20).optional(),
  memory_limit_kb: z.number().int().min(1024).max(512000).optional(),
});

export const testCaseSchema = z.object({
  input: z.string().max(200000),
  expected_output: z.string().max(200000),
  is_hidden: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
});

export const submitSchema = z.object({
  languageId: z.string().uuid(),
  sourceCode: z
    .string()
    .min(1)
    .refine((s) => Buffer.byteLength(s, 'utf8') <= MAX_SOURCE_BYTES, {
      message: `Source code exceeds ${MAX_SOURCE_BYTES} bytes`,
    }),
});

export const runSchema = z.object({
  languageId: z.string().uuid(),
  sourceCode: z
    .string()
    .min(1)
    .refine((s) => Buffer.byteLength(s, 'utf8') <= MAX_SOURCE_BYTES, {
      message: `Source code exceeds ${MAX_SOURCE_BYTES} bytes`,
    }),
  stdin: z.string().max(100000).optional().nullable(),
});
