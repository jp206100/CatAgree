import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const PARTICIPANT_PATH = /^\/p\/([A-Za-z0-9_-]+)/;
const PARTICIPANT_COOKIE = "catagree_p";
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export default convexAuthNextjsMiddleware(async (request) => {
  const match = request.nextUrl.pathname.match(PARTICIPANT_PATH);
  if (match) {
    const token = match[1];
    const response = NextResponse.next();
    response.cookies.set({
      name: PARTICIPANT_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_DAYS_SECONDS,
    });
    return response;
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
