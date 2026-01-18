import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const contentItem = await prisma.contentItem.findUnique({
            where: { id },
            select: {
                id: true,
                provider: true,
                type: true,
                metadata: true,
                url: true
            }
        });

        if (!contentItem) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // Delete from Storage based on Provider
        try {
            if (contentItem.provider === 'supabase' && contentItem.metadata?.path) {
                const bucket = contentItem.metadata.bucket || 'content';
                const { error } = await supabase.storage
                    .from(bucket)
                    .remove([contentItem.metadata.path]);

                if (error) console.error("Supabase Deletion Error:", error);
            }
        } catch (storageError) {
            console.error("Storage deletion failed:", storageError);
            // Proceed to delete DB record anyway
        }

        await prisma.contentItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const contentItem = await prisma.contentItem.findUnique({
            where: { id },
            include: {
                topic: true
            }
        });

        if (!contentItem) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: contentItem });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
