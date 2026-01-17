import { NextResponse } from 'next/server';

export async function GET() {
    const classes = [
        { id: '11', name: 'Class 11' },
        { id: '12', name: 'Class 12' },
    ];

    return NextResponse.json({
        success: true,
        data: classes,
    });
}
