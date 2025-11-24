import { prisma } from './prisma';

export interface SectionMatch {
  section: any;
  score: number;
  reason: string;
}

/**
 * Calculate relevance score for a section based on prompt
 */
function calculateRelevanceScore(section: any, prompt: string): number {
  if (!prompt || prompt.trim() === '') {
    return 0;
  }

  const promptLower = prompt.toLowerCase();
  const promptWords = promptLower
    .split(/\s+/)
    .filter((word) => word.length > 2); // Filter out short words

  let score = 0;

  // Check title match (highest weight)
  const titleLower = section.title.toLowerCase();
  promptWords.forEach((word) => {
    if (titleLower.includes(word)) {
      score += 3;
    }
  });

  // Check description match
  const descLower = (section.description || '').toLowerCase();
  promptWords.forEach((word) => {
    if (descLower.includes(word)) {
      score += 2;
    }
  });

  // Check tag matches (high weight)
  const tags = section.tags || [];
  promptWords.forEach((word) => {
    if (tags.some((tag: string) => tag.toLowerCase().includes(word))) {
      score += 2.5;
    }
  });

  // Exact phrase matches get bonus
  if (titleLower.includes(promptLower) || descLower.includes(promptLower)) {
    score += 5;
  }

  // Check for common section keywords
  const commonKeywords: { [key: string]: string[] } = {
    hero: ['hero', 'banner', 'header', 'landing'],
    product: ['product', 'shop', 'collection', 'item', 'merchandise'],
    testimonial: ['testimonial', 'review', 'customer', 'feedback'],
    feature: ['feature', 'benefit', 'advantage', 'why'],
    image: ['image', 'photo', 'picture', 'visual'],
    text: ['text', 'content', 'copy', 'description'],
    grid: ['grid', 'list', 'collection', 'gallery'],
    slider: ['slider', 'carousel', 'swiper', 'slideshow'],
    form: ['form', 'contact', 'newsletter', 'signup'],
    faq: ['faq', 'question', 'answer', 'help'],
  };

  Object.entries(commonKeywords).forEach(([key, keywords]) => {
    if (keywords.some((kw) => promptLower.includes(kw))) {
      if (tags.includes(key) || titleLower.includes(key)) {
        score += 3;
      }
    }
  });

  return score;
}

/**
 * Find the best matching section from the library based on prompt
 */
export async function findBestMatch(
  prompt: string,
  userTags?: string[]
): Promise<SectionMatch | null> {
  // Get all accessible sections
  let where: any = {};

  // Filter by user's accessible tags (free users can only see free sections)
  if (userTags && userTags.length > 0) {
    where.tags = { hasSome: userTags };
  }

  const sections = await prisma.section.findMany({
    where,
  });

  if (sections.length === 0) {
    return null;
  }

  // Score all sections
  const scoredSections: SectionMatch[] = sections.map((section) => {
    const score = calculateRelevanceScore(section, prompt);
    let reason = '';

    if (score > 10) {
      reason = 'Excellent match based on your description';
    } else if (score > 5) {
      reason = 'Good match for your needs';
    } else if (score > 2) {
      reason = 'Partial match - may need customization';
    } else {
      reason = 'Basic match - will require significant customization';
    }

    return {
      section,
      score,
      reason,
    };
  });

  // Sort by score (highest first)
  scoredSections.sort((a, b) => b.score - a.score);

  // Return the best match (even if score is low, we'll still return something)
  return scoredSections[0] || null;
}

/**
 * Generate section code using library matching (no AI required)
 */
export async function generateFromLibrary(
  prompt: string,
  sectionId?: string,
  userTags?: string[]
): Promise<{ code: string; matchedSection?: any; matchScore?: number }> {
  let section: any = null;
  let matchScore = 0;

  // If sectionId is provided, use that section
  if (sectionId) {
    section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
  } else {
    // Otherwise, find the best match
    const match = await findBestMatch(prompt, userTags);
    if (match && match.score > 0) {
      section = match.section;
      matchScore = match.score;
    }
  }

  if (!section) {
    throw new Error(
      'No matching section found. Please try a different description or select a section from the library.'
    );
  }

  // Return the section's base template
  // In a more advanced version, you could do simple text replacements
  // based on the prompt, but for now we'll return the template as-is
  return {
    code: section.baseTemplate,
    matchedSection: section,
    matchScore,
  };
}

