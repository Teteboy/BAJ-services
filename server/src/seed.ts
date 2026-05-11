/**
 * BAJ Services — Database Seed (Enhanced)
 * Creates: 3 products, 1 admin, 6 clients, orders, deliveries, invoices, payments, stock
 * Run: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const prisma = new PrismaClient();

function genOrderNumber(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${ts}-${rand}`;
}

function genInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-8)}`;
}

async function main() {
  console.log('🌱 Seeding BAJ Services database (enhanced)...\n');

  // ── Products ────────────────────────────────────────────────
  const gasoil = await prisma.product.upsert({
    where: { code: 'GASOIL' },
    update: {},
    create: { name: 'Gasoil', code: 'GASOIL', description: 'Diesel fuel for industrial machinery and transport' },
  });

  const fuelOil = await prisma.product.upsert({
    where: { code: 'FUEL_OIL' },
    update: {},
    create: { name: 'Fuel Oil', code: 'FUEL_OIL', description: 'Heavy fuel oil for industrial boilers and generators' },
  });

  const kerosene = await prisma.product.upsert({
    where: { code: 'KEROSENE' },
    update: {},
    create: { name: 'Kerosene', code: 'KEROSENE', description: 'Kerosene for industrial and heating use' },
  });

  const superPetrol = await prisma.product.upsert({
    where: { code: 'SUPER' },
    update: {},
    create: { name: 'Super Petrol', code: 'SUPER', description: 'Premium unleaded petrol for vehicles' },
  });

  console.log('✓ Products:', gasoil.name, fuelOil.name, kerosene.name, superPetrol.name);

  // ── Admin ────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bajservices.com' },
    update: {},
    create: { email: 'admin@bajservices.com', password: adminPwd, name: 'BAJ Administrator', role: 'ADMIN' },
  });
  console.log('✓ Admin:', admin.email, '/ admin123');

  // ── Clients ──────────────────────────────────────────────────
  const clientPwd = await bcrypt.hash('client123', 12);

  const clientsData = [
    {
      email: 'acme@example.com',
      name: 'ACME Industries',
      company: 'ACME Industries Sarl',
      phone: '+237 699 000 001',
      terms: 'DAYS_30' as const,
      locations: [
        { name: 'Douala Main Plant', address: 'Zone Industrielle Bassa, Douala' },
        { name: 'Yaounde Warehouse', address: 'Zone Industrielle, Yaounde' },
      ],
      prices: [
        { productId: gasoil.id, pricePerLiter: 750 },
        { productId: fuelOil.id, pricePerLiter: 680 },
        { productId: kerosene.id, pricePerLiter: 810 },
      ],
    },
    {
      email: 'sonacom@example.com',
      name: 'SONACOM',
      company: 'SONACOM Sarl',
      phone: '+237 699 000 002',
      terms: 'DAYS_15' as const,
      locations: [
        { name: 'Kribi Industrial Site', address: 'Kribi Port Area, Littoral Region' },
        { name: 'Limbe Depot', address: 'Industrial Area, Limbe' },
      ],
      prices: [
        { productId: gasoil.id, pricePerLiter: 770 },
        { productId: kerosene.id, pricePerLiter: 800 },
      ],
    },
    {
      email: 'camtrans@example.com',
      name: 'CamTrans Logistics',
      company: 'CamTrans Logistics SA',
      phone: '+237 699 000 003',
      terms: 'DAYS_30' as const,
      locations: [
        { name: 'Douala Central Depot', address: 'Bonaberi Industrial Zone, Douala' },
        { name: 'Ngaoundere Hub', address: 'Zone Commerciale, Ngaoundere' },
        { name: 'Garoua Terminal', address: 'Route de Maroua, Garoua' },
      ],
      prices: [
        { productId: gasoil.id, pricePerLiter: 740 },
        { productId: superPetrol.id, pricePerLiter: 780 },
        { productId: fuelOil.id, pricePerLiter: 660 },
      ],
    },
    {
      email: 'alucam@example.com',
      name: 'ALUCAM',
      company: 'ALUCAM SA',
      phone: '+237 699 000 004',
      terms: 'DAYS_10' as const,
      locations: [
        { name: 'Edea Smelter', address: 'Edea Industrial Zone, Centre Region' },
      ],
      prices: [
        { productId: fuelOil.id, pricePerLiter: 670 },
        { productId: gasoil.id, pricePerLiter: 760 },
      ],
    },
    {
      email: 'cimencam@example.com',
      name: 'CIMENCAM',
      company: 'Cimenteries du Cameroun',
      phone: '+237 699 000 005',
      terms: 'IMMEDIATE' as const,
      locations: [
        { name: 'Figuil Factory', address: 'Figuil, North Region' },
        { name: 'Nomayos Plant', address: 'Nomayos, Yaounde' },
      ],
      prices: [
        { productId: gasoil.id, pricePerLiter: 755 },
        { productId: fuelOil.id, pricePerLiter: 690 },
        { productId: kerosene.id, pricePerLiter: 820 },
      ],
    },
    {
      email: 'brasseries@example.com',
      name: 'Brasseries du Cameroun',
      company: 'Brasseries du Cameroun SA',
      phone: '+237 699 000 006',
      terms: 'DAYS_30' as const,
      locations: [
        { name: 'Douala Brewery', address: 'Rue des Brasseries, Akwa Douala' },
        { name: 'Yaounde Brewery', address: 'Avenue de Melen, Yaounde' },
        { name: 'Bafoussam Plant', address: 'Zone Industrielle, Bafoussam' },
      ],
      prices: [
        { productId: gasoil.id, pricePerLiter: 748 },
        { productId: fuelOil.id, pricePerLiter: 685 },
        { productId: superPetrol.id, pricePerLiter: 785 },
      ],
    },
  ];

  const createdClients: { client: any; locations: any[] }[] = [];

  for (const cd of clientsData) {
    const existing = await prisma.user.findUnique({ where: { email: cd.email } });
    if (existing) {
      const client = await prisma.client.findUnique({
        where: { userId: existing.id },
        include: { deliveryLocations: true, productPrices: true },
      });
      createdClients.push({ client, locations: client?.deliveryLocations ?? [] });
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: cd.email,
        password: clientPwd,
        name: cd.name,
        role: 'CLIENT',
        client: {
          create: {
            companyName: cd.company,
            phone: cd.phone,
            paymentTerms: cd.terms,
            deliveryLocations: { create: cd.locations },
            productPrices: { create: cd.prices },
          },
        },
      },
      include: { client: { include: { deliveryLocations: true } } },
    });
    createdClients.push({ client: user.client, locations: user.client?.deliveryLocations ?? [] });
    console.log('✓ Client:', cd.email, '/ client123');
  }

  // ── Orders + Deliveries + Invoices ───────────────────────────
  const termDays: Record<string, number> = { IMMEDIATE: 0, DAYS_10: 10, DAYS_15: 15, DAYS_30: 30 };

  const orderScenarios = [
    // Older delivered orders (generate invoices + payments)
    { daysAgo: 45, status: 'DELIVERED' as const, paid: true },
    { daysAgo: 38, status: 'DELIVERED' as const, paid: true },
    { daysAgo: 30, status: 'DELIVERED' as const, paid: true },
    { daysAgo: 22, status: 'DELIVERED' as const, paid: false },
    { daysAgo: 15, status: 'DELIVERED' as const, paid: false },
    { daysAgo: 10, status: 'VALIDATED' as const, paid: false },
    { daysAgo: 5, status: 'PENDING' as const, paid: false },
    { daysAgo: 2, status: 'PENDING' as const, paid: false },
    { daysAgo: 1, status: 'REJECTED' as const, paid: false },
  ];

  let ordersCreated = 0;
  let invoicesCreated = 0;

  for (let ci = 0; ci < Math.min(createdClients.length, 6); ci++) {
    const { client, locations } = createdClients[ci];
    if (!client || !locations.length) continue;

    const clientPrices = await prisma.clientProductPrice.findMany({
      where: { clientId: client.id },
      include: { product: true },
    });

    if (!clientPrices.length) continue;

    const scenariosForClient = orderScenarios.slice(0, Math.min(3 + (ci % 3), orderScenarios.length));

    for (const scenario of scenariosForClient) {
      const delivDate = addDays(subDays(new Date(), scenario.daysAgo), 3);
      const location = locations[ci % locations.length];
      const price = clientPrices[0];

      // Check if similar order already exists
      const existingOrders = await prisma.order.count({ where: { clientId: client.id } });
      if (existingOrders >= scenariosForClient.length) break;

      const quantities = [5000, 8000, 12000, 15000, 20000, 3000][ci % 6];
      const pricePerUnit = price.pricePerLiter;
      const totalAmount = quantities * pricePerUnit;

      const orderNum = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
      await new Promise((r) => setTimeout(r, 5)); // ensure unique timestamps

      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          clientId: client.id,
          deliveryLocationId: location.id,
          status: scenario.status,
          requestedDeliveryDate: delivDate,
          contactPerson: `Contact ${client.companyName}`,
          contactPhone: client.phone ?? '+237 699 000 000',
          notes: scenario.status === 'REJECTED' ? 'Capacity not available for requested date' : undefined,
          rejectionReason: scenario.status === 'REJECTED' ? 'Stock insufficient for this period' : undefined,
          items: {
            create: [{
              productId: price.productId,
              quantity: quantities,
              unit: 'LITERS',
              pricePerUnit,
            }],
          },
        },
      });

      ordersCreated++;

      // Create delivery + invoice for DELIVERED orders
      if (scenario.status === 'DELIVERED') {
        const existingDelivery = await prisma.delivery.findUnique({ where: { orderId: order.id } });
        if (!existingDelivery) {
          await prisma.delivery.create({
            data: {
              orderId: order.id,
              confirmedAt: subDays(new Date(), scenario.daysAgo - 2),
              confirmedById: admin.id,
            },
          });
        }

        const existingInvoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
        if (!existingInvoice) {
          const days = termDays[client.paymentTerms] ?? 0;
          const paymentDeadline = addDays(subDays(new Date(), scenario.daysAgo - 2), days);
          const isOverdue = paymentDeadline < new Date() && !scenario.paid;

          const invoice = await prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
              orderId: order.id,
              clientId: client.id,
              totalAmount,
              paymentDeadline,
              status: scenario.paid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'SENT'),
              paidAt: scenario.paid ? subDays(new Date(), scenario.daysAgo - 5) : undefined,
              items: {
                create: [{
                  productId: price.productId,
                  quantity: quantities,
                  unit: 'LITERS',
                  pricePerUnit,
                  totalAmount,
                }],
              },
            },
          });
          invoicesCreated++;
          await new Promise((r) => setTimeout(r, 5));

          // Record payment for paid invoices
          if (scenario.paid) {
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                amount: totalAmount,
                method: ci % 2 === 0 ? 'VIREMENT' : 'CHEQUE',
                reference: ci % 2 === 0 ? `VIR-${Date.now().toString().slice(-8)}` : `CHQ-${Math.floor(Math.random() * 999999)}`,
                paidAt: subDays(new Date(), scenario.daysAgo - 5),
                confirmedById: admin.id,
              },
            });
          }
        }
      }
    }
  }

  console.log(`✓ Orders created: ${ordersCreated}`);
  console.log(`✓ Invoices created: ${invoicesCreated}`);

  // ── Stock Entries ────────────────────────────────────────────
  const stockProducts = [gasoil, fuelOil, kerosene, superPetrol];

  for (let w = 0; w < 8; w++) {
    const weekStart = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 });

    for (const product of stockProducts) {
      const existing = await prisma.stockEntry.findFirst({
        where: { productId: product.id, weekStartDate: weekStart },
      });
      if (existing) continue;

      const initialStock = (Math.floor(Math.random() * 8) + 5) * 10000; // 50k–130k L
      const totalDelivered = Math.floor(initialStock * (0.4 + Math.random() * 0.4)); // 40–80%

      await prisma.stockEntry.create({
        data: {
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          productId: product.id,
          initialStock,
          totalDelivered,
          remainingStock: initialStock - totalDelivered,
          notes: w === 0 ? 'Current week stock' : undefined,
          createdById: admin.id,
        },
      });
    }
  }

  console.log('✓ Stock entries: 8 weeks × 4 products = 32 entries');

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n🎉 Enhanced seed complete!');
  console.log('\n📋 Credentials:');
  console.log('  Admin:   admin@bajservices.com / admin123');
  for (const cd of clientsData) {
    console.log(`  Client:  ${cd.email} / client123`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
