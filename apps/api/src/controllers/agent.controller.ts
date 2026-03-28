import type { Context } from "hono";

import {
    AGENT_DEBUG_STEPS,
} from "../config";
import {
    getAgentCapabilities,
    isLlmConfigured,
    runResearchAgent,
    type ChatHistoryItem,
} from "../agent";
import type { AgentRunRecord } from "../agent/session/types";

function parseHistory(raw: unknown): ChatHistoryItem[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    const out: ChatHistoryItem[] = [];
    for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const role = (item as { role?: unknown }).role;
        const content = (item as { content?: unknown }).content;
        if (role !== "user" && role !== "model") continue;
        if (typeof content !== "string") continue;
        out.push({ role, content });
    }
    return out.length ? out : undefined;
}

function serializeRun(record: AgentRunRecord): AgentRunRecord | { id: string; stepCount: number } {
    if (AGENT_DEBUG_STEPS) return record;
    return { id: record.id, stepCount: record.steps.length };
}

export function getAgentHandler(c: Context) {
    return c.json({
        ...getAgentCapabilities(),
        llmConfigured: isLlmConfigured(),
    });
}

export async function postAgentChatHandler(c: Context) {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object") {
        return c.json({ error: "Expected JSON object" }, 400);
    }

    const message =
        typeof (body as { message?: unknown }).message === "string"
            ? (body as { message: string }).message
            : "";

    if (!message.trim()) {
        return c.json({ error: "message is required and must be non-empty" }, 400);
    }

    const history = parseHistory((body as { history?: unknown }).history);

    const result = await runResearchAgent({ message, history });

    if (result.error && result.reply === null) {
        const status = result.error.includes("GOOGLE_API_KEY") ? 503 : 500;
        return c.json(
            {
                error: result.error,
                run: serializeRun(result.run),
            },
            status,
        );
    }

    return c.json({
        reply: result.reply,
        run: serializeRun(result.run),
    });
}
