import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Sparkles, BookOpen, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      subscriptionPlan: true,
      sectionUsageCount: true,
    },
  });

  const recentLogs = await prisma.generationLog.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      section: {
        select: {
          title: true,
        },
      },
    },
  });

  const stats = {
    totalGenerations: dbUser?.sectionUsageCount || 0,
    plan: dbUser?.subscriptionPlan || 'free',
    limit: dbUser?.subscriptionPlan === 'pro' ? 'Unlimited' : 5,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Generations
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalGenerations}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Subscription Plan
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
                {stats.plan}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Generation Limit
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.limit}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Generations
        </h2>
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No generations yet. Start creating sections!
          </p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.section?.title || 'Custom Section'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {log.prompt}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.plan === 'free' && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
          <p className="text-purple-100 mb-4">
            Unlock unlimited generations and access to all premium sections.
          </p>
          <button className="px-6 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}

