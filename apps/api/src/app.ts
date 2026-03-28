import { Hono } from "hono";

import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.get("/", (c) => c.text("Hello World"));

export default app;
