import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as path from "path";
import bcrypt from "bcryptjs";

const dbUrl = `file:${path.resolve("./dev.db")}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const db = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminPw = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@resale.mu" },
    update: {},
    create: { name: "Admin", email: "admin@resale.mu", password: adminPw, role: "ADMIN" },
  });

  // Vendor 1
  const v1Pw = await bcrypt.hash("vendor123", 10);
  const vendor1User = await db.user.upsert({
    where: { email: "aisha@resale.mu" },
    update: {},
    create: { name: "Aisha Ramjane", email: "aisha@resale.mu", password: v1Pw, role: "VENDOR" },
  });
  const vendor1 = await db.vendorProfile.upsert({
    where: { userId: vendor1User.id },
    update: {},
    create: {
      userId: vendor1User.id,
      shopName: "Aisha's Boutique",
      description: "Handcrafted fashion and accessories from Mauritius. Every piece tells a story.",
      location: "Port Louis, Mauritius",
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: "monthly",
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Vendor 2
  const v2Pw = await bcrypt.hash("vendor123", 10);
  const vendor2User = await db.user.upsert({
    where: { email: "raj@resale.mu" },
    update: {},
    create: { name: "Raj Patel", email: "raj@resale.mu", password: v2Pw, role: "VENDOR" },
  });
  const vendor2 = await db.vendorProfile.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      userId: vendor2User.id,
      shopName: "Raj's Electronics",
      description: "Quality electronics and gadgets at competitive prices. Serving Mauritius since 2018.",
      location: "Curepipe, Mauritius",
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: "yearly",
      subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Customer
  const custPw = await bcrypt.hash("customer123", 10);
  const customer = await db.user.upsert({
    where: { email: "customer@resale.mu" },
    update: {},
    create: { name: "Marie Dupont", email: "customer@resale.mu", password: custPw, role: "CUSTOMER" },
  });

  // Products for Vendor 1
  const v1Products = [
    { name: "Handwoven Basket Bag", description: "Beautiful handwoven basket bag made from natural raffia. Perfect for beach days or casual outings.", price: 850, category: "Clothing", imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400", stock: 5 },
    { name: "Vanilla Scented Candle Set", description: "Set of 3 hand-poured soy candles with real Mauritian vanilla extract. Burn time 40 hours each.", price: 650, category: "Home & Garden", imageUrl: "https://images.unsplash.com/photo-1602607513562-0e1f01d57d87?w=400", stock: 12 },
    { name: "Coral Print Sarong", description: "Vibrant coral reef print sarong, 100% cotton. One size fits all.", price: 420, category: "Clothing", imageUrl: "https://images.unsplash.com/photo-1583744946564-b52d01a7b321?w=400", stock: 8 },
    { name: "Seashell Wind Chime", description: "Handcrafted wind chime made with real shells collected from Mauritius beaches.", price: 380, category: "Home & Garden", imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400", stock: 6 },
    { name: "Embroidered Table Runner", description: "Hand-embroidered table runner with traditional Mauritian patterns, 180cm length.", price: 1200, category: "Home & Garden", imageUrl: "https://images.unsplash.com/photo-1616628188467-8fb0c1afc2b9?w=400", stock: 3 },
  ];

  for (const p of v1Products) {
    const pid = `seed-v1-${p.name.replace(/\s+/g, "-").toLowerCase()}`;
    await db.product.upsert({
      where: { id: pid },
      update: {},
      create: { id: pid, ...p, vendorId: vendor1.id, isPublished: true },
    });
  }

  // Products for Vendor 2
  const v2Products = [
    { name: "Wireless Earbuds Pro", description: "Premium wireless earbuds with active noise cancellation and 30hr battery life.", price: 2800, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400", stock: 15 },
    { name: "Smart Watch Series 3", description: "Fitness tracking, heart rate monitor, sleep analysis. Water resistant to 50m.", price: 4500, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400", stock: 7 },
    { name: "Portable Power Bank 20000mAh", description: "Fast-charging 20000mAh power bank with 3 USB ports and USB-C PD input.", price: 1800, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1585338107503-aee73ee4bfdc?w=400", stock: 20 },
    { name: "Bluetooth Speaker Mini", description: "Waterproof compact Bluetooth speaker with 12hr battery and 360° sound.", price: 1250, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400", stock: 9 },
    { name: "USB-C Laptop Stand", description: "Adjustable aluminum laptop stand with USB-C hub, compatible with all laptops.", price: 1650, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400", stock: 11 },
  ];

  for (const p of v2Products) {
    const pid = `seed-v2-${p.name.replace(/\s+/g, "-").toLowerCase()}`;
    await db.product.upsert({
      where: { id: pid },
      update: {},
      create: { id: pid, ...p, vendorId: vendor2.id, isPublished: true },
    });
  }

  // Sample conversation
  const firstV1Product = await db.product.findFirst({ where: { vendorId: vendor1.id } });
  if (firstV1Product) {
    const conv = await db.conversation.upsert({
      where: {
        vendorId_customerId_productId: {
          vendorId: vendor1.id,
          customerId: customer.id,
          productId: firstV1Product.id,
        },
      },
      update: {},
      create: { vendorId: vendor1.id, customerId: customer.id, productId: firstV1Product.id },
    });
    const existingMsgs = await db.message.count({ where: { conversationId: conv.id } });
    if (existingMsgs === 0) {
      const sampleMsgs = [
        { senderId: customer.id, receiverId: vendor1User.id, content: "Hi! Is the basket bag still available?" },
        { senderId: vendor1User.id, receiverId: customer.id, content: "Yes it is! Would you like to arrange a pickup or delivery?" },
        { senderId: customer.id, receiverId: vendor1User.id, content: "Delivery please. Can we do Rs.850 including delivery?" },
      ];
      for (const m of sampleMsgs) {
        await db.message.create({ data: { ...m, conversationId: conv.id } });
      }
    }
  }

  console.log("✓ Seed complete!");
  console.log("  Admin:    admin@resale.mu / admin123");
  console.log("  Vendor 1: aisha@resale.mu / vendor123 (Aisha's Boutique)");
  console.log("  Vendor 2: raj@resale.mu / vendor123 (Raj's Electronics)");
  console.log("  Customer: customer@resale.mu / customer123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
