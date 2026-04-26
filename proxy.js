export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/search/:path*", "/facility/:path*"],
};
