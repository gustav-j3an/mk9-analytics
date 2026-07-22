import { z } from 'zod';
export const industrySchema=z.object({code:z.string().trim().min(1,'Código é obrigatório').max(50),name:z.string().trim().min(1,'Nome é obrigatório').max(255),contractedFrequency:z.coerce.number().int().min(0).max(365).optional().nullable()});
export const industryUpdateSchema=industrySchema.partial();
export const validateIndustryData=(data:unknown)=>industrySchema.parse(data);
export const validateIndustryUpdateData=(data:unknown)=>industryUpdateSchema.parse(data);
