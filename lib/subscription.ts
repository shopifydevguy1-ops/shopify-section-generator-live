import { prisma } from './prisma';

export const FREE_TIER_LIMIT = 5;

export async function canUserGenerate(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.subscriptionPlan === 'pro') {
    return { allowed: true };
  }

  if (user.sectionUsageCount >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      reason: `You've reached the free tier limit of ${FREE_TIER_LIMIT} generations. Upgrade to Pro for unlimited access.`,
    };
  }

  return { allowed: true };
}

export async function canUserAccessSection(
  userId: string,
  sectionTags: string[]
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.subscriptionPlan === 'pro') {
    return { allowed: true };
  }

  // Free users can only access sections with "free" tag
  if (!sectionTags.includes('free')) {
    return {
      allowed: false,
      reason: 'This section is only available for Pro users. Upgrade to unlock premium sections.',
    };
  }

  return { allowed: true };
}

export async function incrementUsageCount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      sectionUsageCount: {
        increment: 1,
      },
    },
  });
}

