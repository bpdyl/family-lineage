import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});

export const memberCreateSchema = z.object({
  name_np: z.string().max(200).default(''),
  name_en: z.string().max(200).default(''),
  spouse_np: z.string().max(200).default(''),
  spouse_en: z.string().max(200).default(''),
  parent_id: z.string().min(1, 'parent_id is required'),
  relationship: z.enum(['son', 'daughter']),
  notes: z.string().max(2000).default(''),
});

export const memberUpdateSchema = z.object({
  name_np: z.string().max(200).optional(),
  name_en: z.string().max(200).optional(),
  spouse_np: z.string().max(200).optional(),
  spouse_en: z.string().max(200).optional(),
  relationship: z.enum(['son', 'daughter']).optional(),
  notes: z.string().max(2000).optional(),
});

export const extraFieldSchema = z.object({
  fields: z.array(z.object({
    field_key: z.string().min(1).max(100),
    field_value: z.string().max(2000).default(''),
  })).min(1),
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.validated = result.data;
    next();
  };
}
