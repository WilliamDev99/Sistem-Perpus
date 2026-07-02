import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

// Parse DATABASE_URL and create adapter with longer timeouts for remote connections
const dbUrl = new URL(process.env.DATABASE_URL as string);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  connectTimeout: 30000,
  acquireTimeout: 30000,
  connectionLimit: 5,
});
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

  // Create sample books matching local uploads
  const books = [
    { 
      title: "Filsafat Seni", 
      author: "Jakob Sumardjo", 
      publisher: "Penerbit ITB", 
      year: 2006, 
      isbn: "978979134561", 
      categoryId: categories["Agama"], 
      stock: 5, 
      coverImage: "/api/uploads/1778274321468-oc8ruow.jpg",
      description: "Analisis mendalam mengenai makna dan hakikat seni dari perspektif filsafat." 
    },
    { 
      title: "Estetika: Suatu Pengantar", 
      author: "Dharsono Soni Kartika", 
      publisher: "Rekayasa Sains", 
      year: 2007, 
      isbn: "978979134562", 
      categoryId: categories["Non-Fiksi"], 
      stock: 4, 
      coverImage: "/api/uploads/1778274103323-f8kmpa4.jpg",
      description: "Buku pengantar untuk memahami nilai-nilai keindahan seni dan budaya." 
    },
    { 
      title: "Sejarah Estetika", 
      author: "Dr. Martinus Dwi Marianto", 
      publisher: "Lembaga Penelitian ISI", 
      year: 2011, 
      isbn: "978979134563", 
      categoryId: categories["Sejarah"], 
      stock: 3, 
      coverImage: "/api/uploads/1778273869769-x2m940k.jpg",
      description: "Perkembangan teori keindahan seni dari zaman klasik hingga postmodern." 
    },
    { 
      title: "Pengantar Sejarah Kebudayaan Indonesia 1", 
      author: "Dr. R. Soekmono", 
      publisher: "Kanisius", 
      year: 1973, 
      isbn: "978979134564", 
      categoryId: categories["Sejarah"], 
      stock: 3, 
      coverImage: "/api/uploads/1778273703422-bq65zuv.jpg",
      description: "Buku pertama dari seri sejarah kebudayaan Indonesia, membahas zaman prasejarah." 
    },
    { 
      title: "Pengantar Sejarah Kebudayaan Indonesia 2", 
      author: "Dr. R. Soekmono", 
      publisher: "Kanisius", 
      year: 1973, 
      isbn: "978979134565", 
      categoryId: categories["Sejarah"], 
      stock: 4, 
      coverImage: "/api/uploads/1778273479722-znv6i3o.jpg",
      description: "Buku kedua dari seri sejarah kebudayaan Indonesia, membahas pengaruh kebudayaan Hindu-Buddha." 
    },
    { 
      title: "Pengantar Sejarah Kebudayaan Indonesia 3", 
      author: "Dr. R. Soekmono", 
      publisher: "Kanisius", 
      year: 1973, 
      isbn: "978979134566", 
      categoryId: categories["Sejarah"], 
      stock: 5, 
      coverImage: "/api/uploads/1778273381761-e7em7dl.jpg",
      description: "Buku ketiga dari seri sejarah kebudayaan Indonesia, membahas kebudayaan Islam dan perkembangannya." 
    },
    { 
      title: "Arsitektur Sistem Komputer", 
      author: "Maman Abdurohman", 
      publisher: "Informatika", 
      year: 2014, 
      isbn: "978979134567", 
      categoryId: categories["Teknologi"], 
      stock: 3, 
      coverImage: "/api/uploads/1778249278115-vp81ju3.jpg",
      description: "Struktur internal, organisasi, dan desain sistem komputer modern." 
    },
    { 
      title: "Arkeologi Pengetahuan", 
      author: "Michel Foucault", 
      publisher: "IRCiSoD", 
      year: 2012, 
      isbn: "978979134568", 
      categoryId: categories["Sejarah"], 
      stock: 2, 
      coverImage: "/api/uploads/1778248981675-8llyoim.jpg",
      description: "Terjemahan karya klasik Michel Foucault tentang epistemologi wacana." 
    },
    { 
      title: "Arkeologi: Ilmu Menggali Peninggalan Masa Lalu", 
      author: "Taufik Abdullah", 
      publisher: "Balai Pustaka", 
      year: 2005, 
      isbn: "978979134569", 
      categoryId: categories["Sejarah"], 
      stock: 4, 
      coverImage: "/api/uploads/1778248659400-23f6c5d.jpg",
      description: "Metodologi riset arkeologi dan tata cara penggalian artefak kuno." 
    },
    { 
      title: "Kuliah Pengantar Arkeologi", 
      author: "Dr. R. Soekmono", 
      publisher: "Penerbitan Universitas", 
      year: 1980, 
      isbn: "978979134570", 
      categoryId: categories["Sejarah"], 
      stock: 5, 
      coverImage: "/api/uploads/1778248557553-7husnga.png",
      description: "Modul pengantar ilmu arkeologi untuk mahasiswa tingkat awal." 
    },
    { 
      title: "Dasar Pemrograman Bahasa C", 
      author: "Yudhi Purwanto", 
      publisher: "Elex Media Komputindo", 
      year: 2015, 
      isbn: "978979134571", 
      categoryId: categories["Teknologi"], 
      stock: 4, 
      coverImage: "/api/uploads/1778248166460-wgzvggt.jpg",
      description: "Dasar-dasar logika pemrograman menggunakan sintaks bahasa C." 
    },
    { 
      title: "Pemrograman Web dengan Node.js dan Javascript", 
      author: "Budi Raharjo", 
      publisher: "Informatika", 
      year: 2018, 
      isbn: "978979134572", 
      categoryId: categories["Teknologi"], 
      stock: 5, 
      coverImage: "/api/uploads/1778247905719-b7u9s1o.jpg",
      description: "Panduan membangun backend serverless dan website dinamis dengan Node.js." 
    },
    { 
      title: "Kamus Istilah Komputer Lengkap", 
      author: "Jacko Pramana", 
      publisher: "Kawan Pustaka", 
      year: 2013, 
      isbn: "978979134573", 
      categoryId: categories["Teknologi"], 
      stock: 6, 
      coverImage: "/api/uploads/1778247735527-f2cfi0j.jpg",
      description: "Kamus lengkap referensi istilah-istilah di bidang komputer dan IT." 
    },
    { 
      title: "Pengantar Teknologi Informasi", 
      author: "Tata Sutabri", 
      publisher: "Andi Offset", 
      year: 2014, 
      isbn: "978979134574", 
      categoryId: categories["Teknologi"], 
      stock: 7, 
      coverImage: "/api/uploads/1778247503273-k4ihntf.jpeg",
      description: "Pengenalan teknologi informasi masa kini serta infrastruktur jaringan dasar." 
    },
  ];

  for (const bookData of books) {
    await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: {
        title: bookData.title,
        author: bookData.author,
        coverImage: bookData.coverImage,
        categoryId: bookData.categoryId,
        description: bookData.description,
      },
      create: bookData,
    });
  }
  console.log("✅ Books created/updated:", books.length);

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
