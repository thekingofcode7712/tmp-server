import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered before express.json() for signature verification
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const { handleStripeWebhook } = await import('../stripe-webhook');
    await handleStripeWebhook(req, res);
  });
  
  // Configure body parser with no size limit for file uploads
  app.use(express.json({ limit: "Infinity" }));
  app.use(express.urlencoded({ limit: "Infinity", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Initialize scheduled jobs
  const { autoResumeSubscriptions, checkUsageAlerts } = await import('../scheduled-jobs');
  const { monitorConnections } = await import('../kill-switch');
  
  // Run immediately on startup
  autoResumeSubscriptions();
  checkUsageAlerts();
  monitorConnections();
  
  // Run auto-resume daily
  setInterval(autoResumeSubscriptions, 24 * 60 * 60 * 1000);
  // Run usage alerts every 6 hours
  setInterval(checkUsageAlerts, 6 * 60 * 60 * 1000);
  // Monitor VPN connections every 5 seconds
  setInterval(monitorConnections, 5000);
}

startServer().catch(console.error);
