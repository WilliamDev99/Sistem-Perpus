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
  const categoryNames = ["Sains", "Informatika", "Sejarah", "Ekonomi", "Pendidikan", "Filsafat", "Hukum"];
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
      title: "Dasar Pemrograman Dalam Bahasa C", 
      author: "Yudhi Purwanto", 
      publisher: "Elex Media Komputindo", 
      year: 2015, 
      isbn: "978979134561", 
      categoryId: categories["Informatika"], 
      stock: 5, 
      coverImage: "/api/uploads/Dasar Pemograman Dalam Bahasa C.jpg",
      description: "Dasar-dasar logika pemrograman menggunakan sintaks bahasa C." 
    },
    { 
      title: "Dasar-Dasar Teknik Informatika", 
      author: "Tata Sutabri", 
      publisher: "Andi Offset", 
      year: 2014, 
      isbn: "978979134562", 
      categoryId: categories["Informatika"], 
      stock: 4, 
      coverImage: "/api/uploads/Dasar-Dasar Teknik informatika.jpg",
      description: "Pengenalan teknologi informasi masa kini serta infrastruktur jaringan dasar." 
    },
    { 
      title: "Pembelajaran Informatika", 
      author: "Budi Raharjo", 
      publisher: "Informatika", 
      year: 2018, 
      isbn: "978979134563", 
      categoryId: categories["Informatika"], 
      stock: 6, 
      coverImage: "/api/uploads/Pembelajaran Informatika.jpg",
      description: "Buku pembelajaran komputasi dan pemecahan masalah algoritma." 
    },
    { 
      title: "Arsitektur Sistem Komputer", 
      author: "Maman Abdurohman", 
      publisher: "Informatika", 
      year: 2014, 
      isbn: "978979134564", 
      categoryId: categories["Informatika"], 
      stock: 3, 
      coverImage: "/api/uploads/Arsiktektur Sistem Komputer.jpg",
      description: "Struktur internal, organisasi, dan desain sistem komputer modern." 
    },
    { 
      title: "Arkeologi Pengetahuan", 
      author: "Michel Foucault", 
      publisher: "IRCiSoD", 
      year: 2012, 
      isbn: "978979134565", 
      categoryId: categories["Sejarah"], 
      stock: 4, 
      coverImage: "/api/uploads/Aerkeologi Pengetahuan.jpg",
      description: "Terjemahan karya klasik Michel Foucault tentang epistemologi wacana." 
    },
    { 
      title: "Kuliah Pengantar Arkeologi", 
      author: "Dr. R. Soekmono", 
      publisher: "Penerbitan Universitas", 
      year: 1980, 
      isbn: "978979134566", 
      categoryId: categories["Sejarah"], 
      stock: 5, 
      coverImage: "/api/uploads/Kuliah Pegantar Arkeologi.png",
      description: "Modul pengantar ilmu arkeologi untuk mahasiswa tingkat awal." 
    },
    { 
      title: "Pengantar Ekonomi", 
      author: "Lanny Widjaja", 
      publisher: "Salemba Empat", 
      year: 2016, 
      isbn: "978979134567", 
      categoryId: categories["Ekonomi"], 
      stock: 5, 
      coverImage: "/api/uploads/Pegantar Ekonomi.jpg",
      description: "Buku pengantar dasar-dasar teori ekonomi mikro dan makro." 
    },
    { 
      title: "Ekonomi Pembangunan", 
      author: "Dwi Martani, dkk", 
      publisher: "Salemba Empat", 
      year: 2018, 
      isbn: "978979134568", 
      categoryId: categories["Ekonomi"], 
      stock: 4, 
      coverImage: "/api/uploads/Ekonomi Pembagunan.jpg",
      description: "Analisis isu-isu pembangunan ekonomi di Indonesia." 
    },
    { 
      title: "Pengantar Akuntansi II", 
      author: "Carl S. Warren", 
      publisher: "Salemba Empat", 
      year: 2015, 
      isbn: "978979134569", 
      categoryId: categories["Ekonomi"], 
      stock: 6, 
      coverImage: "/api/uploads/pegantar akuntansi 2.jpg",
      description: "Materi dasar akuntansi lanjutan edisi adaptasi Indonesia." 
    },
    { 
      title: "Akuntansi Keuangan Berbasis PSAK", 
      author: "Dwi Martani, dkk", 
      publisher: "Salemba Empat", 
      year: 2018, 
      isbn: "978979134570", 
      categoryId: categories["Ekonomi"], 
      stock: 4, 
      coverImage: "/api/uploads/Akuntansi keuangan berbasis psak.jpg",
      description: "Panduan lengkap akuntansi keuangan menengah berbasis PSAK terbaru." 
    },
    { 
      title: "Akuntansi Perbankan", 
      author: "Lanny Widjaja", 
      publisher: "Salemba Empat", 
      year: 2016, 
      isbn: "978979134571", 
      categoryId: categories["Ekonomi"], 
      stock: 5, 
      coverImage: "/api/uploads/akuntansi perbankan.jpg",
      description: "Buku ajar penyusunan laporan keuangan perbankan." 
    },
    { 
      title: "Buku Ajar Akuntansi", 
      author: "Hery, S.E., M.Si.", 
      publisher: "Grasindo", 
      year: 2015, 
      isbn: "978979134572", 
      categoryId: categories["Ekonomi"], 
      stock: 7, 
      coverImage: "/api/uploads/buku ajar akuntansi.jpeg",
      description: "Dasar pemahaman pembukuan keuangan untuk pemula dan bisnis." 
    },
    { 
      title: "Filsafat Ilmu", 
      author: "Jakob Sumardjo", 
      publisher: "Penerbit ITB", 
      year: 2006, 
      isbn: "978979134573", 
      categoryId: categories["Filsafat"], 
      stock: 5, 
      coverImage: "/api/uploads/Filsafat Ilmu.jpg",
      description: "Analisis mendalam mengenai makna dan hakikat kebenaran dalam ilmu pengetahuan." 
    },
    { 
      title: "Fundamental Hukum Internasional", 
      author: "Dr. Martinus Dwi Marianto", 
      publisher: "Penerbit Akademik", 
      year: 2011, 
      isbn: "978979134574", 
      categoryId: categories["Hukum"], 
      stock: 3, 
      coverImage: "/api/uploads/fundamental hukum internasional.jpg",
      description: "Prinsip-prinsip dasar tata hukum internasional antar negara." 
    },
    { 
      title: "Hukum Adat Indonesia", 
      author: "Taufik Abdullah", 
      publisher: "Balai Pustaka", 
      year: 2005, 
      isbn: "978979134575", 
      categoryId: categories["Hukum"], 
      stock: 4, 
      coverImage: "/api/uploads/Hukum adat indonesia.jpg",
      description: "Sejarah dan kodifikasi hukum adat masyarakat nusantara." 
    },
    { 
      title: "Hukum Bisnis", 
      author: "Jacko Pramana", 
      publisher: "Kawan Pustaka", 
      year: 2013, 
      isbn: "978979134576", 
      categoryId: categories["Hukum"], 
      stock: 6, 
      coverImage: "/api/uploads/hukum bisnis.jpg",
      description: "Kumpulan regulasi, aturan main, dan hukum komersial di Indonesia." 
    },
    { 
      title: "Hukum dan Kontrak Bisnis", 
      author: "Jacko Pramana", 
      publisher: "Kawan Pustaka", 
      year: 2013, 
      isbn: "978979134577", 
      categoryId: categories["Hukum"], 
      stock: 6, 
      coverImage: "/api/uploads/hukum dan kontrak bisnis.jpeg",
      description: "Panduan praktis perancangan kontrak bisnis yang legal." 
    },
    { 
      title: "Pengantar Hukum Indonesia", 
      author: "Dr. Martinus Dwi Marianto", 
      publisher: "Lembaga Penelitian ISI", 
      year: 2011, 
      isbn: "978979134578", 
      categoryId: categories["Hukum"], 
      stock: 3, 
      coverImage: "/api/uploads/pegantar hukum indonesia.jpg",
      description: "Pengenalan sistem hukum, tata urutan, dan lembaga hukum di Indonesia." 
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
