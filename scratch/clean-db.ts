import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

async function cleanDatabase() {
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
    console.log("Cleaning old books and borrows...");
    
    // Deleting borrows and fines first due to foreign key constraints
    await prisma.fine.deleteMany({});
    await prisma.borrow.deleteMany({});
    await prisma.book.deleteMany({});
    await prisma.category.deleteMany({});
    
    console.log("Database clean successful!");
  } catch (error) {
    console.error("Clean failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
