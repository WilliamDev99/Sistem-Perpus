import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  email: z.string().email("Email tidak valid").optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
