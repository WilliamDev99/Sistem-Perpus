import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

// Initialize adapter just for the seeder
const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@perpustakaan.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@perpustakaan.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "08123456789",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create member user
  const memberPassword = await bcrypt.hash("member123", 12);
  const member = await prisma.user.upsert({
    where: { email: "member@perpustakaan.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "member@perpustakaan.com",
      password: memberPassword,
      role: "MEMBER",
      phone: "08987654321",
      address: "Jl. Merdeka No. 10, Jakarta",
    },
  });
  console.log("✅ Member created:", member.email);

  // Create categories
  const categoryNames = ["Fiksi", "Non-Fiksi", "Sains", "Teknologi", "Sejarah", "Bisnis", "Pendidikan", "Agama"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }
  console.log("✅ Categories created:", categoryNames.length);

  // Create sample books
  const books = [
    { title: "Laskar Pelangi", author: "Andrea Hirata", publisher: "Bentang Pustaka", year: 2005, isbn: "9789793062792", categoryId: categories["Fiksi"], stock: 5, description: "Novel inspiratif tentang perjuangan anak-anak Belitung dalam mengejar pendidikan." },
    { title: "Bumi Manusia", author: "Pramoedya Ananta Toer", publisher: "Lentera Dipantara", year: 1980, isbn: "9789799731234", categoryId: categories["Fiksi"], stock: 3, description: "Novel sejarah tentang perjuangan Minke di era kolonial Belanda." },
    { title: "Sapiens", author: "Yuval Noah Harari", publisher: "Harper", year: 2015, isbn: "9780062316097", categoryId: categories["Sejarah"], stock: 4, description: "Sejarah singkat umat manusia dari zaman prasejarah hingga modern." },
    { title: "Atomic Habits", author: "James Clear", publisher: "Penguin", year: 2018, isbn: "9780735211292", categoryId: categories["Bisnis"], stock: 7, description: "Cara mudah membangun kebiasaan baik dan menghentikan kebiasaan buruk." },
    { title: "Clean Code", author: "Robert C. Martin", publisher: "Prentice Hall", year: 2008, isbn: "9780132350884", categoryId: categories["Teknologi"], stock: 3, description: "Panduan menulis kode yang bersih dan mudah dipelihara." },
    { title: "A Brief History of Time", author: "Stephen Hawking", publisher: "Bantam", year: 1988, isbn: "9780553380163", categoryId: categories["Sains"], stock: 2, description: "Pengenalan kosmologi dan fisika untuk pembaca umum." },
    { title: "Filosofi Teras", author: "Henry Manampiring", publisher: "Kompas", year: 2018, isbn: "9786024126636", categoryId: categories["Non-Fiksi"], stock: 6, description: "Filsafat Stoa untuk kehidupan modern orang Indonesia." },
    { title: "The Lean Startup", author: "Eric Ries", publisher: "Crown Business", year: 2011, isbn: "9780307887894", categoryId: categories["Bisnis"], stock: 4, description: "Metode startup lean untuk membangun bisnis yang sukses." },
  ];

  for (const bookData of books) {
    await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: {},
      create: bookData,
    });
  }
  console.log("✅ Books created:", books.length);

  console.log("\n🎉 Seeding selesai!");
  console.log("\n📋 Akun Login:");
  console.log("   Admin  -> admin@perpustakaan.com / admin123");
  console.log("   Member -> member@perpustakaan.com / member123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
