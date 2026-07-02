import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

async function testConnection() {
  console.log("Testing connection with DATABASE_URL:", process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set!");
    return;
  }

  const dbUrl = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    connectTimeout: 10000,
    acquireTimeout: 10000,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Connection successful! Users count sample:", users.length);
  } catch (error) {
    console.error("Connection failed with error details:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
