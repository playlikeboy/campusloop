import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    handler: "/handler",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/app",
    afterSignUp: "/onboarding",
    afterSignOut: "/sign-in",
    oauthCallback: "/handler/oauth-callback",

    default: {
      type: "hosted",
    },
  },
});
