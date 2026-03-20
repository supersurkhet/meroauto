/**
 * Convex auth config for WorkOS.
 *
 * This tells Convex how to verify JWTs from WorkOS.
 * Set WORKOS_CLIENT_ID in Convex environment variables.
 */
export default {
  providers: [
    {
      // WorkOS JWKS endpoint for token verification
      domain: "https://api.workos.com",
      applicationID: process.env.WORKOS_CLIENT_ID ?? "convex",
    },
  ],
};
