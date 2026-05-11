import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const clientHash = await bcrypt.hash('client123', 12);

  const r1 = await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { password: adminHash } });
  const r2 = await prisma.user.updateMany({ where: { role: 'CLIENT' }, data: { password: clientHash } });

  console.log(`Updated ${r1.count} admin(s), ${r2.count} client(s). Passwords are fresh.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
