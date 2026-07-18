import { z } from 'zod';
import { OperationStatus } from '@prisma/client';

export const operationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  month: z.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020, 'Year must be 2020 or later'),
  startsAt: z.date(),
  endsAt: z.date(),
  status: z.nativeEnum(OperationStatus).optional(),
  description: z.string().max(1000).optional(),
  clientId: z.string().optional(),
  observations: z.string().optional(),
});

export const operationUpdateSchema = operationSchema.partial();

export type OperationFormValues = z.infer<typeof operationSchema>;