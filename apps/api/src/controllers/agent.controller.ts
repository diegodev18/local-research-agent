import type { Context } from "hono";

import {
    AGENT_DEBUG_STEPS,
} from "../config";
import { log } from "../lib/logger";
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

function messagePreview(text: string, max = 160): string {
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 3)}...`;
}

export function getAgentHandler(c: Context) {
    log.info("agent.http.capabilities");
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
        log.warn("agent.chat.bad_request", { reason: "invalid_json" });
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object") {
        log.warn("agent.chat.bad_request", { reason: "not_object" });
        return c.json({ error: "Expected JSON object" }, 400);
    }

    const message =
        typeof (body as { message?: unknown }).message === "string"
            ? (body as { message: string }).message
            : "";

    if (!message.trim()) {
        log.warn("agent.chat.bad_request", { reason: "empty_message" });
        return c.json({ error: "message is required and must be non-empty" }, 400);
    }

    const history = parseHistory((body as { history?: unknown }).history);

    log.info("agent.chat.incoming", {
        messagePreview: messagePreview(message),
        messageChars: message.length,
        historyTurns: history?.length ?? 0,
    });

    const result = await runResearchAgent({ message, history });

    if (result.error && result.reply === null) {
        const status = result.error.includes("GOOGLE_API_KEY") ? 503 : 500;
        log.warn("agent.chat.response", {
            runId: result.run.id,
            status,
            error: result.error,
        });
        return c.json(
            {
                error: result.error,
                run: serializeRun(result.run),
            },
            status,
        );
    }

    log.info("agent.chat.response", {
        runId: result.run.id,
        status: 200,
        replyChars: result.reply?.length ?? 0,
        stepCount: result.run.steps.length,
    });

    return c.json({
        reply: result.reply,
        run: serializeRun(result.run),
    });
}
