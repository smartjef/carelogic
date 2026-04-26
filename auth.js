import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const demoUsers = [
  { id: "1", email: "admin@healthintel.io", password: "demo1234", name: "Health Admin" },
  { id: "2", email: "ops@healthintel.io", password: "demo1234", name: "Ops Analyst" },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "dev-only-secret-change-in-production",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = demoUsers.find(
          (entry) =>
            entry.email === credentials?.email &&
            entry.password === credentials?.password
        );
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const protectedPaths = ["/dashboard", "/search", "/facility"];
      const isProtected = protectedPaths.some((prefix) => path.startsWith(prefix));
      if (isProtected) return !!session;
      return true;
    },
  },
});
