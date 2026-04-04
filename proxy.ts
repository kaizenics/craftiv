import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

function buildSignInRedirectUrl(request: NextRequest) {
	const signInUrl = new URL("/sign-in", request.url);
	const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	signInUrl.searchParams.set("redirect", redirectPath);
	return signInUrl;
}

async function isAuthenticated(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	return Boolean(session?.user);
}

export async function proxy(request: NextRequest) {
	const authenticated = await isAuthenticated(request);

	if (authenticated) {
		return NextResponse.next();
	}

	return NextResponse.redirect(buildSignInRedirectUrl(request));
}

export const config = {
	matcher: ["/dashboard/:path*", "/cover-letter/write/:path*", "/resume/section/:path*"],
};
