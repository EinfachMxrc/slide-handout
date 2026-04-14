import { z } from "zod";

export const RegisterPayload = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(256),
  displayName: z.string().min(1).max(80),
});
export type RegisterPayload = z.infer<typeof RegisterPayload>;

export const LoginPayload = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});
export type LoginPayload = z.infer<typeof LoginPayload>;
