import { Hono } from "hono";

import { cors } from "hono/cors";

import agentRoutes from "./routes/agent.route";

const app = new Hono();

app.use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.get("/api/health", (c) => c.text("Hello World"));
app.route("/api/agent", agentRoutes);

export default app;
