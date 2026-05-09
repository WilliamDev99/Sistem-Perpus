import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().min(1, "Judul buku wajib diisi").max(200),
  author: z.string().min(1, "Penulis wajib diisi").max(200),
  publisher: z.string().min(1, "Penerbit wajib diisi").max(200),
  year: z.number().int().min(1900, "Tahun tidak valid").max(new Date().getFullYear() + 1),
  isbn: z.string().min(10, "ISBN minimal 10 karakter").max(20),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  stock: z.number().int().min(0, "Stok tidak boleh negatif"),
  coverImage: z.string().optional(),
  description: z.string().optional(),
});

export const bookFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type BookInput = z.infer<typeof bookSchema>;
export type BookFilter = z.infer<typeof bookFilterSchema>;
