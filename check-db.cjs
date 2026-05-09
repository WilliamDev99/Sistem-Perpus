import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const result = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM users');
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
