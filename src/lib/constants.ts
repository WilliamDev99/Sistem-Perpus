export const APP_NAME = "Perpustakaan Digital";
export const APP_DESCRIPTION = "Sistem Manajemen Perpustakaan Modern";

// Denda per hari keterlambatan (dalam Rupiah)
export const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 1000;

// Durasi peminjaman default (dalam hari)
export const BORROW_DURATION_DAYS = Number(process.env.BORROW_DAYS) || 7;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Status labels (Bahasa Indonesia)
export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  BORROWED: "Dipinjam",
  RETURNED: "Dikembalikan",
  OVERDUE: "Terlambat",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Anggota",
};
