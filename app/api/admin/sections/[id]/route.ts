import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  previewImage: z.string().nullable().optional(),
  baseTemplate: z.string().min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) {
    return admin;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = sectionSchema.parse(body);

    const section = await prisma.section.update({
      where: { id },
      data,
    });

    return NextResponse.json({ section });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) {
    return admin;
  }

  try {
    const { id } = await params;
    await prisma.section.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

