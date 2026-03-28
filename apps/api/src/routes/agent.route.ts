import { Hono } from "hono";

import {
    getAgentHandler,
    postAgentChatHandler,
} from "../controllers/agent.controller";

const agentRoutes = new Hono();

agentRoutes.get("/", getAgentHandler);
agentRoutes.post("/chat", postAgentChatHandler);

export default agentRoutes;
