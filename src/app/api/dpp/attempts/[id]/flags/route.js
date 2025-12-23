import { NextResponse } from 'next/server';

export async function PUT(request) {
    // Flag logic could go here
    return NextResponse.json({ success: true });
}
