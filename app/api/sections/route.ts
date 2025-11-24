import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag');

    let where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    // If user is free tier, only show free sections
    if (user && user.role !== 'admin') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
      });

      if (dbUser?.subscriptionPlan === 'free') {
        where.tags = { has: 'free' };
      }
    }

    const sections = await prisma.section.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

