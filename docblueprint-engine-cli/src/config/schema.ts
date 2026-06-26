import { z } from 'zod';

const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  description: z.string(),
});

const FlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  persona: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string(),
});

const StackSchema = z.object({
  backend: z.string().optional(),
  frontend: z.string().optional(),
  mobile: z.string().optional(),
  database: z.string().optional(),
  cloud: z.string().optional(),
  infra: z.string().optional(),
  containerisation: z.string().optional(),
});

export const BlueprintConfigSchema = z.object({
  project: z.object({
    name: z.string(),
    description: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must be semver'),
  }),
  businessModel: z.array(z.enum(['B2B', 'B2C', 'B2B2C', 'SaaS', 'PaaS'])).min(1).optional(),
  domain: z.string().optional(),
  compliance: z.array(z.enum(['HIPAA', 'GDPR', 'SOC2', 'PCI-DSS', 'none'])).optional(),
  personas: z.array(PersonaSchema).optional(),
  flows: z.array(FlowSchema).optional(),
  stack: StackSchema.optional(),
  releaseModel: z.enum(['continuous', 'sprint-based', 'manual', 'mixed']).optional(),
  featureFlags: z.boolean().optional(),
  versioning: z.boolean().optional(),
});

export type BlueprintConfig = z.infer<typeof BlueprintConfigSchema>;

export function validateConfig(data: unknown): BlueprintConfig {
  return BlueprintConfigSchema.parse(data);
}
