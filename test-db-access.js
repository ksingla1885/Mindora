const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const models = [
    'user',
    'test',
    'testAttempt',
    'contentItem',
    'analyticsEvent',
    'subject',
    'payment'
  ];

  for (const model of models) {
    try {
      if (prisma[model]) {
        const count = await prisma[model].count();
        console.log(`✅ Model ${model} exists and has ${count} records.`);
      } else {
        console.log(`❌ Model ${model} is NOT in the prisma client.`);
      }
    } catch (err) {
      console.log(`⚠️ Model ${model} exists but query failed: ${err.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
