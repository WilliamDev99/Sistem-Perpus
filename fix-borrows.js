const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  const overdueBorrows = await prisma.borrow.findMany({
    where: {
      status: { in: ['OVERDUE', 'BORROWED'] },
      dueDate: { lt: now },
      fine: null,
    }
  });
  
  let count = 0;
  for (const borrow of overdueBorrows) {
    const dueDate = new Date(borrow.dueDate);
    const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const fineAmount = diffDays * 2000;
    
    await prisma.borrow.update({
      where: { id: borrow.id },
      data: { status: 'RETURNED', returnDate: now }
    });
    
    await prisma.book.update({
      where: { id: borrow.bookId },
      data: { stock: { increment: 1 } }
    });
    
    if (fineAmount > 0) {
      await prisma.fine.create({
        data: {
          borrowId: borrow.id,
          amount: fineAmount,
          paid: true,
          paidAt: now
        }
      });
    }
    count++;
  }
  
  console.log('Successfully returned and paid ' + count + ' books.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
