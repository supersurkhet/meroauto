/**
 * Convex auth config for WorkOS AuthKit.
 *
 * Tells Convex how to verify JWTs issued by WorkOS.
 * WORKOS_CLIENT_ID must be set in Convex environment variables.
 *
 * WorkOS JWKS endpoint: https://api.workos.com/sso/jwks/{clientId}
 */
export default {
  providers: [
    {
      domain: "https://api.workos.com",
      applicationID: process.env.WORKOS_CLIENT_ID ?? "client_01KKYG4JJK79BPD8C3QHRPKVS9",
    },
  ],
};
