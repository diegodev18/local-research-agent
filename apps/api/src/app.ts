import { Hono } from "hono";

import { cors } from "hono/cors";

import { log } from "./lib/logger";
import agentRoutes from "./routes/agent.route";

const app = new Hono();

app.use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.use("*", async (c, next) => {
    if (c.req.method === "OPTIONS") {
        return next();
    }
    const forwarded = c.req.header("x-forwarded-for");
    const clientIp =
        forwarded?.split(",")[0]?.trim() ??
        c.req.header("x-real-ip") ??
        "unknown";
    const userAgent = (c.req.header("user-agent") ?? "").slice(0, 160);
    const started = Date.now();
    await next();
    const ms = Date.now() - started;
    log.info("http.request", {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms,
        clientIp,
        userAgent: userAgent || undefined,
    });
});

app.get("/api/health", (c) => c.text("Hello World"));
app.route("/api/agent", agentRoutes);

export default app;
