import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserGenerate, canUserAccessSection, incrementUsageCount } from '@/lib/subscription';
import { generateSection } from '@/lib/openai';
import { generateFromLibrary } from '@/lib/section-matcher';
import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  sectionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, sectionId } = generateSchema.parse(body);

    // Check if user can generate
    const canGenerate = await canUserGenerate(user.userId);
    if (!canGenerate.allowed) {
      return NextResponse.json(
        { error: canGenerate.reason },
        { status: 403 }
      );
    }

    // Get user's accessible tags
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    const userTags = dbUser?.subscriptionPlan === 'free' ? ['free'] : undefined;

    // If sectionId is provided, check access and get template
    let baseTemplate: string | undefined;
    let selectedSection: any = null;
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
      });

      if (!section) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      const canAccess = await canUserAccessSection(user.userId, section.tags);
      if (!canAccess.allowed) {
        return NextResponse.json(
          { error: canAccess.reason },
          { status: 403 }
        );
      }

      baseTemplate = section.baseTemplate;
      selectedSection = section;
    }

    // Generate section code - try OpenAI first, fallback to library matching
    let generatedCode: string;
    let matchedSection: any = null;
    let matchScore: number | undefined = undefined;

    try {
      // Try OpenAI if available
      generatedCode = await generateSection(prompt, baseTemplate);
    } catch (error) {
      // Fallback to library matching
      console.log('OpenAI not available, using library matching...');
      
      const libraryResult = await generateFromLibrary(
        prompt,
        sectionId || undefined,
        userTags
      );
      
      generatedCode = libraryResult.code;
      matchedSection = libraryResult.matchedSection;
      matchScore = libraryResult.matchScore;
    }

    // Increment usage count
    await incrementUsageCount(user.userId);

    // Log generation
    await prisma.generationLog.create({
      data: {
        userId: user.userId,
        sectionId: sectionId || null,
        prompt,
        generatedCode,
      },
    });

    return NextResponse.json({
      code: generatedCode,
      matchedSection: matchedSection || selectedSection,
      matchScore,
      source: process.env.OPENAI_API_KEY ? 'openai' : 'library',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate section. Please try again.' },
      { status: 500 }
    );
  }
}

