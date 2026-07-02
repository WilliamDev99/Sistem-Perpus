import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

async function fixPaths() {
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
    console.log("Fetching all books to update paths...");
    const books = await prisma.book.findMany({
      select: { id: true, coverImage: true }
    });

    let updatedCount = 0;
    for (const book of books) {
      if (book.coverImage && book.coverImage.startsWith("/uploads/")) {
        const newPath = book.coverImage.replace("/uploads/", "/api/uploads/");
        await prisma.book.update({
          where: { id: book.id },
          data: { coverImage: newPath }
        });
        updatedCount++;
      }
    }
    console.log(`Successfully updated ${updatedCount} books coverImage paths to /api/uploads/!`);
  } catch (error) {
    console.error("Path correction failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaths();
