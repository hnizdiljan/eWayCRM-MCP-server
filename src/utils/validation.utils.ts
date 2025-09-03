import { z } from 'zod';
import { API_CONSTANTS } from '../constants/api.constants';

export const paginationSchema = z.object({
  limit: z.coerce.number()
    .min(1)
    .max(API_CONSTANTS.PAGINATION.MAX_LIMIT)
    .default(API_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
  offset: z.coerce.number()
    .min(0)
    .default(API_CONSTANTS.PAGINATION.DEFAULT_OFFSET),
  q: z.string().optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID musí být platné UUID')
});

export const companyIdParamSchema = z.object({
  companyId: z.string().uuid('Company ID musí být platné UUID')
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      throw new Error(`Validace selhala: ${JSON.stringify(errors)}`);
    }
    throw error;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Odstranění HTML tagů
    .slice(0, 1000); // Limit délky
}

export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}