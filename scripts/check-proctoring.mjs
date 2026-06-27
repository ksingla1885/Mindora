import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tests = await prisma.test.findMany({
    select: {
      id: true,
      title: true,
      proctoringEnabled: true,
      tabMonitoringEnabled: true,
      enforceFullscreen: true,
      faceDetectionEnabled: true,
    }
  });
  
  console.log('Current tests and proctoring flags:');
  console.log(JSON.stringify(tests, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
