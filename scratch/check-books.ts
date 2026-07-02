import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

async function checkBooks() {
  const dbUrl = new URL(process.env.DATABASE_URL as string);
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const books = await prisma.book.findMany({
      select: { id: true, title: true, isbn: true, coverImage: true }
    });
    console.log("Current books in database:");
    console.log(JSON.stringify(books, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooks();
