import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import {openapi} from "@elysiajs/openapi";
import { inventoryRoutes } from "./routes/inventory";

const PORT = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const defaultCorsOrigins = [
  /^https:\/\/.*-\d+\.app\.github\.dev$/,
  "http://localhost:5173",
  "https://localhost:5173",
];
const resolvedCorsOrigins = corsOrigin
  ? corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)
  : defaultCorsOrigins;

const app = new Elysia()
  .use(openapi())
  .use(
    cors({
      origin: corsOrigin === "*" ? true : resolvedCorsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: true,
      credentials: false,
    })
  )

  // Health check
  .get("/health", () => ({ status: "ok" }))

  // API routes
  .use(inventoryRoutes)

  .listen(PORT);

console.log(`🚀 to-do-api running at http://localhost:${PORT}`);

export type App = typeof app;
