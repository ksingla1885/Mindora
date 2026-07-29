require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Test Slug Population...');
  try {
    const tests = await prisma.test.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    });

    console.log(`Found ${tests.length} tests without a slug.`);

    let updatedCount = 0;
    for (const test of tests) {
      let baseSlug = slugify(test.title, { lower: true, strict: true });
      if (!baseSlug) {
        baseSlug = 'test';
      }
      
      let slug = baseSlug;
      let isUnique = false;
      let attempt = 0;

      while (!isUnique) {
        const potentialSlug = attempt === 0 ? slug : `${slug}-${attempt}`;
        // Check database
        const existingTest = await prisma.test.findFirst({
          where: { slug: potentialSlug }
        });
        
        if (!existingTest) {
          slug = potentialSlug;
          isUnique = true;
        } else {
          attempt++;
        }
      }

      await prisma.test.update({
        where: { id: test.id },
        data: { slug }
      });

      console.log(`- Updated test "${test.title}" -> "${slug}"`);
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} tests with slugs.`);
  } catch (error) {
    console.error('Error populating slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
