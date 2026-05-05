import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  appName: "Recipe Book",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CORS_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    camelCase: true
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"]
    })
  ]
});
