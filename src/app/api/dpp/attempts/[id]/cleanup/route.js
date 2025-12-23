import { NextResponse } from 'next/server';

export async function POST(request) {
    // Cleanup logic could go here
    return NextResponse.json({ success: true });
}
