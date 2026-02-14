import { NextResponse } from 'next/server';
import { CategoryService } from '@/services/CategoryService';

export async function GET() {
    try {
        const categories = await CategoryService.getAll();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = 'system-admin'; // Stub until NextAuth is ready

        const category = await CategoryService.create(body, userId);
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
