const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('paymentid') || line.toLowerCase().includes('payment_id')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
