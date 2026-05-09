import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

import * as mariadb from "mariadb";
const pool = mariadb.createPool(process.env.DATABASE_URL as string);
const adapter = new PrismaMariaDb(pool as any);
const prisma = new PrismaClient({ adapter });

async function check() {
  const userId = "cmomq84vz0000y0sbm3oz67fk"; // William's ID
  try {
    const res = await prisma.$queryRaw`
      SELECT DATE_FORMAT(borrowDate, '%Y-%m') as month, COUNT(*) as count
      FROM borrows 
      WHERE userId = ${userId} AND borrowDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(borrowDate, '%Y-%m')
      ORDER BY month ASC
    `;
    console.log("Raw query result:", res);
  } catch (e) {
    console.error("Query failed!", e);
  }
}

check().finally(() => prisma.$disconnect());
