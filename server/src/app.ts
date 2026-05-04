import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import pino from "pino";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./auth/auth.routes.js";
import { auth } from "./auth/auth.js";
import { resolveSession } from "./auth/session.js";
import { env } from "./config/env.js";
import { initializeDatabase } from "./db/init.js";
import { createOpenApiDocument } from "./docs/openapi.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { recipeRouter } from "./modules/recipes/recipe.routes.js";
import { shoppingListRouter } from "./modules/shopping-lists/shopping-list.routes.js";
import { errorHandler } from "./shared/http/error-handler.js";
import { notFoundHandler } from "./shared/http/not-found.js";

const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info"
});

initializeDatabase();

const openApiDocument = createOpenApiDocument();

export const app = express();

app.use((request, response, next) => {
  const startedAt = Date.now();

  response.on("finish", () => {
    logger.info(
      {
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt
      },
      "request completed"
    );
  });

  next();
});

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

const authHandler = toNodeHandler(auth);

app.use(/^\/api\/auth(?:\/.*)?$/, (request, response) => {
  void authHandler(request, response);
});

app.use(express.json());
app.use(resolveSession);

app.get("/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: "Recipe Book API Docs"
  })
);

app.get("/", (_request, response) => {
  response.json({
    name: "recipe-book-server",
    status: "ok",
    docs: {
      swaggerUi: "/docs",
      openApiJson: "/openapi.json",
      session: "/api/session",
      auth: "/api/auth",
      health: "/api/health",
      recipes: "/api/recipes",
      shoppingLists: "/api/shopping-lists"
    }
  });
});

app.use("/api", authRouter);
app.use("/api/health", healthRouter);
app.use("/api/recipes", recipeRouter);
app.use("/api/shopping-lists", shoppingListRouter);

app.use(notFoundHandler);
app.use(errorHandler);
