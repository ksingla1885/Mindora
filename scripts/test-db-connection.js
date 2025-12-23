
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Testing database connection...');

    // Manually load .env since we don't want to install dotenv just for this
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        console.log('Loading .env file...');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // simple unquote
                process.env[key] = value;
            }
        });
    } else {
        console.log('.env file not found at', envPath);
    }

    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL is missing from environment variables');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        console.log('Attempting to connect...');
        await prisma.$connect();
        console.log('Successfully connected to the database!');

        // Try a simple query
        const userCount = await prisma.user.count();
        console.log(`Connection verified. User count: ${userCount}`);

    } catch (error) {
        console.error('Failed to connect to the database:');
        console.error(error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
