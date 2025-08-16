import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.password || user.deletedAt) return null;

        const ok = await compare(creds.password, user.password);
        if (!ok) return null;

        // Only return what's needed
        return { id: user.id, email: user.email, name: user.name, image: user.image ?? undefined };
      },
    }),

    // Let Google give us id/email/name/image that match your schema
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name ?? null,
          image: profile.picture ?? null,
        };
      },
    }),
  ],

  callbacks: {
    // If Google account has no name, force user to complete it
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user?.email) return false;
        if (!user.name || user.name.trim() === "") {
          return "/auth/complete-profile";
        }
      }
      return true;
    },

    // Put id/email/name/image on the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        token.image = (user as any).image ?? null;
      }
      return token;
    },

    // And expose that on session.user
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any) = {
          id: (token as any).id,
          email: token.email,
          name: token.name,
          image: (token as any).image ?? null,
        };
      }
      return session;
    },
  },
};
