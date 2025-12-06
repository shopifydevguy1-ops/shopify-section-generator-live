import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/pricing", "/sign-in(.*)", "/sign-up(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Track login for non-API routes (to avoid tracking API calls)
    // Use a lightweight approach - just trigger the API call asynchronously
    if (!isApiRoute(req) && req.method === 'GET') {
      // Fire and forget - don't block the request
      fetch(`${req.nextUrl.origin}/api/track-login`, {
        method: 'POST',
        headers: {
          'Cookie': req.headers.get('cookie') || '',
        },
      }).catch(err => console.error("Error tracking login:", err))
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

