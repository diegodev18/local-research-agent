const env = process.env;

export const {
    GOOGLE_API_KEY,
    MAIN_AGENT_MODEL = "gemini-3-flash-preview",
    PORT,
    BASE_URL,
} = env;

/** Absolute path; defaults to cwd in development */
export const AGENT_WORKSPACE_ROOT =
    env.AGENT_WORKSPACE_ROOT ?? process.cwd();

export const AGENT_MAX_FILE_BYTES = Number(
    env.AGENT_MAX_FILE_BYTES ?? 512_000,
);
export const AGENT_MAX_TOOL_OUTPUT_CHARS = Number(
    env.AGENT_MAX_TOOL_OUTPUT_CHARS ?? 32_000,
);
export const AGENT_MAX_AGENT_STEPS = Number(
    env.AGENT_MAX_AGENT_STEPS ?? 24,
);
export const AGENT_DEBUG_STEPS = env.AGENT_DEBUG_STEPS === "true";

export const AGENT_SEARCH_MAX_FILES = Number(
    env.AGENT_SEARCH_MAX_FILES ?? 400,
);
export const AGENT_SEARCH_MAX_MATCHES = Number(
    env.AGENT_SEARCH_MAX_MATCHES ?? 80,
);
