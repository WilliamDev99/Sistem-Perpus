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
      title: "Dasar Pemrograman Dalam Bahasa C", 
      author: "Bernadus Anggo Seno Aji, S.Kom., M.Kom.", 
      publisher: "Penerbit Lokal", 
      year: 2021, 
      isbn: "9786021234561", 
      categoryId: categories["Teknologi"], 
      stock: 5, 
      coverImage: "/api/uploads/1778274321468-oc8ruow.jpg",
      description: "Buku panduan dasar pemrograman terstruktur menggunakan bahasa C." 
    },
    { 
      title: "Dasar-Dasar Teknik Informatika", 
      author: "Novega Pratama Adiputra", 
      publisher: "Penerbit Lokal", 
      year: 2020, 
      isbn: "9786021234562", 
      categoryId: categories["Teknologi"], 
      stock: 4, 
      coverImage: "/api/uploads/1778274103323-f8kmpa4.jpg",
      description: "Pengenalan konsep dasar teknik informatika dan logika komputasi." 
    },
    { 
      title: "Pembelajaran Informatika dalam Kurikulum Merdeka", 
      author: "Muhamad Afif Effindi, et al.", 
      publisher: "Pendidikan Press", 
      year: 2022, 
      isbn: "9786021234563", 
      categoryId: categories["Pendidikan"], 
      stock: 6, 
      coverImage: "/api/uploads/1778273869769-x2m940k.jpg",
      description: "Buku panduan pengajaran informatika sesuai standar kurikulum merdeka." 
    },
    { 
      title: "Filsafat Ilmu", 
      author: "Joni Harnedi, M. IS.", 
      publisher: "Penerbit Akademik", 
      year: 2019, 
      isbn: "9786021234564", 
      categoryId: categories["Agama"], 
      stock: 3, 
      coverImage: "/api/uploads/1778273703422-bq65zuv.jpg",
      description: "Kajian mendalam tentang filsafat ilmu pengetahuan dan epistemologi." 
    },
    { 
      title: "Pengantar Ekonomi", 
      author: "Firman, SE., MM. / Endang Sriningsih, SE.", 
      publisher: "Ekonomi Press", 
      year: 2018, 
      isbn: "9786021234565", 
      categoryId: categories["Bisnis"], 
      stock: 5, 
      coverImage: "/api/uploads/1778273479722-znv6i3o.jpg",
      description: "Konsep dasar teori ekonomi mikro dan makro untuk pemula." 
    },
    { 
      title: "Ekonomi Pembangunan", 
      author: "Dr. Christea Frisdiantara / Dr. Imam Mukhlis", 
      publisher: "Ekonomi Press", 
      year: 2020, 
      isbn: "9786021234566", 
      categoryId: categories["Bisnis"], 
      stock: 4, 
      coverImage: "/api/uploads/1778273381761-e7em7dl.jpg",
      description: "Analisis pembangunan ekonomi di negara berkembang." 
    },
    { 
      title: "Arsitektur Sistem Komputer", 
      author: "F. Trias Pontia W., ST., MT. / Ir. Fitri Imansyah", 
      publisher: "Sains & Tekno", 
      year: 2021, 
      isbn: "9786021234567", 
      categoryId: categories["Teknologi"], 
      stock: 3, 
      coverImage: "/api/uploads/1778249278115-vp81ju3.jpg",
      description: "Struktur organisasi dan desain internal sistem komputer modern." 
    },
    { 
      title: "Arkeologi Pengetahuan", 
      author: "Michel Foucault", 
      publisher: "Pustaka Budaya", 
      year: 2002, 
      isbn: "9786021234568", 
      categoryId: categories["Sejarah"], 
      stock: 2, 
      coverImage: "/api/uploads/1778248981675-8llyoim.jpg",
      description: "Terjemahan karya klasik Michel Foucault tentang epistemologi wacana." 
    },
    { 
      title: "Arkeologi: Ilmu Menggali Peninggalan Masa Lalu", 
      author: "M. Yusuf Zulfikar", 
      publisher: "Sejarah Press", 
      year: 2017, 
      isbn: "9786021234569", 
      categoryId: categories["Sejarah"], 
      stock: 4, 
      coverImage: "/api/uploads/1778248659400-23f6c5d.jpg",
      description: "Metodologi riset lapangan arkeologi dan analisis artefak kuno." 
    },
    { 
      title: "Kuliah Pengantar Arkeologi", 
      author: "Churchill Babington", 
      publisher: "Sejarah Press", 
      year: 2015, 
      isbn: "9786021234570", 
      categoryId: categories["Sejarah"], 
      stock: 5, 
      coverImage: "/api/uploads/1778248557553-7husnga.png",
      description: "Modul pengantar kuliah sejarah arkeologi untuk mahasiswa tingkat awal." 
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
