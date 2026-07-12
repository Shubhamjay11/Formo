import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Passthrough stub — session/route guards land in docs/features/001-auth.md T5.
 * Next.js requires middleware.ts to export a middleware function when present.
 */
export function middleware(_request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
