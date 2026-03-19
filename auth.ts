import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/welcome",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const path = request.nextUrl.pathname
      const isPublic = path === "/welcome" || path === "/login"

      if (isPublic) return true          // always allow public pages
      if (isLoggedIn) return true        // logged-in users can access everything
      return false                       // redirect to welcome
    },
  },
})
