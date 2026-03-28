import { randomUUID } from "node:crypto";

import type { Content } from "@google/generative-ai";

import {
    AGENT_MAX_AGENT_STEPS,
    AGENT_MAX_FILE_BYTES,
    AGENT_MAX_TOOL_OUTPUT_CHARS,
    AGENT_SEARCH_MAX_FILES,
    AGENT_SEARCH_MAX_MATCHES,
    AGENT_WORKSPACE_ROOT,
    MAIN_AGENT_MODEL,
} from "../config";
import llm from "../lib/llm";
import { runAgentLoop } from "./loop/agent-loop";
import { RESEARCH_AGENT_SYSTEM_PROMPT } from "./prompts/system";
import { createTranscript } from "./session/transcript";
import type { AgentRunRecord } from "./session/types";
import type { ToolContext } from "./tools/context";
import { READ_ONLY_TOOL_NAMES } from "./policy/read-only-policy";

export type ChatHistoryItem = { role: "user" | "model"; content: string };

export type ResearchAgentResult = {
    reply: string | null;
    error: string | null;
    run: AgentRunRecord;
};

export function isLlmConfigured(): boolean {
    return llm !== null && Boolean(process.env.GOOGLE_API_KEY?.trim());
}

export function getAgentCapabilities() {
    return {
        mode: "research_read_only" as const,
        tools: [...READ_ONLY_TOOL_NAMES],
        workspaceRoot: AGENT_WORKSPACE_ROOT,
    };
}

export async function runResearchAgent(params: {
    message: string;
    history?: ChatHistoryItem[];
}): Promise<ResearchAgentResult> {
    const runId = randomUUID();
    const { record, push } = createTranscript(runId);

    if (!isLlmConfigured() || !llm) {
        const msg = "GOOGLE_API_KEY is not configured";
        push({ type: "error", message: msg });
        return { reply: null, error: msg, run: record };
    }

    const historyContents: Content[] = (params.history ?? []).map((h) => ({
        role: h.role === "model" ? "model" : "user",
        parts: [{ text: h.content }],
    }));

    const toolContext: ToolContext = {
        workspaceRoot: AGENT_WORKSPACE_ROOT,
        maxFileBytes: AGENT_MAX_FILE_BYTES,
        maxOutputChars: AGENT_MAX_TOOL_OUTPUT_CHARS,
        searchMaxFiles: AGENT_SEARCH_MAX_FILES,
        searchMaxMatches: AGENT_SEARCH_MAX_MATCHES,
    };

    const loopResult = await runAgentLoop({
        genAI: llm,
        modelName: MAIN_AGENT_MODEL ?? "gemini-2.0-flash",
        userMessage: params.message.trim(),
        history: historyContents,
        systemInstruction: RESEARCH_AGENT_SYSTEM_PROMPT,
        toolContext,
        maxSteps: AGENT_MAX_AGENT_STEPS,
        transcriptPush: push,
    });

    if (loopResult.ok) {
        return { reply: loopResult.reply, error: null, run: record };
    }
    return { reply: null, error: loopResult.error, run: record };
}
