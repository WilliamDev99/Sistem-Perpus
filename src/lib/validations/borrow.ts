import { z } from "zod";

export const borrowSchema = z.object({
  bookId: z.string().min(1, "Buku wajib dipilih"),
});

export const borrowActionSchema = z.object({
  borrowId: z.string().min(1),
});

export type BorrowInput = z.infer<typeof borrowSchema>;
