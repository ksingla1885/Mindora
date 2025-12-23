import { NextResponse } from 'next/server';

export async function PUT(request) {
    // Auto-save logic could go here
    return NextResponse.json({ success: true });
}
