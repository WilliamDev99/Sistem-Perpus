export type Role = "ADMIN" | "MEMBER";

export type BorrowStatus = "PENDING" | "BORROWED" | "RETURNED" | "OVERDUE";

export interface BookWithCategory {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  stock: number;
  coverImage: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowWithDetails {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverImage: string | null;
  };
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  fine: {
    id: string;
    amount: number;
    paid: boolean;
  } | null;
}

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeBorrows: number;
  pendingFines: number;
  totalFineAmount: number;
}

export interface Notification {
  id: string;
  type: "overdue" | "info" | "warning";
  message: string;
  borrowId?: string;
  createdAt: string;
  read: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
