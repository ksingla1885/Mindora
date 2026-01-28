
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const className = searchParams.get('class');

        let where = {};
        if (className && className !== 'all') {
            where = {
                OR: [
                    { class: className },
                    { name: { contains: `(Class ${className})` } },
                    // Also include generic subjects (no class specified in name or DB)
                    // ONLY if they don't have a conflicting class tag.
                    // Since filtering "NOT (Class Y)" for all Y != X is hard in one query without a list,
                    // we'll rely on the positive matches first.

                    // However, for "Science", it usually doesn't have a class tag.
                    // If the user wants ONLY class 11, and "Science" is for 9/10, showing it is wrong.
                    // But we don't know "Science" is 9/10.

                    // Strategy: Fetch strict matches.
                    // If the user has structured their data with "(Class X)" tags, this will work perfectly.
                    // If they have "Science" (generic), it won't be returned with this strict query,
                    // effectively hiding it from Class 11 if it doesn't say "Class 11".
                    // This seems to align with the user's "only class 11" request.
                ]
            };

            // If we are looking for 9 or 10, we might WANT generic subjects like "Science".
            // But we can't distinguish "Science" (9-10) from "General Knowledge" (All).
            // Let's widen the search for specific classes if needed, or stick to strict.
            // Strict is safer for "only class 11".
            // If className is 9 or 10, we might want to include subjects with NO class info?
            // where.OR.push({ class: null, NOT: { name: { contains: '(Class ' } } }); 
            // But this would show "Science" for Class 11 too.
            // Let's stick to the strict matches as per the screenshot's naming convention.
        }

        const subjects = await prisma.subject.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
