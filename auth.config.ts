import { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"

export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user) {
            return null
          }

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!passwordsMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (session && session.user) {
        session.user.id = token.id
      }
      return session
    },
  },
} satisfies NextAuthConfig
