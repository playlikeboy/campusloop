import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    handler: "/handler",
    signIn: "/sign-in",
    signUp: "/sign-up",
    afterSignIn: "/app",
    afterSignUp: "/onboarding",
    afterSignOut: "/sign-in",
    oauthCallback: "/handler/oauth-callback",

    default: {
      type: "hosted",
    },
  },
});
