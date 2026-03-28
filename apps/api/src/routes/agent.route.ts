import { Hono } from "hono";

const agentRoutes = new Hono();

agentRoutes.get("/", (c) => c.json({ message: "Hello World" }));

export default agentRoutes;
