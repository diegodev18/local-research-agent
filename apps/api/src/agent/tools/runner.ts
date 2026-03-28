import { isAllowedToolName } from "../policy/read-only-policy";
import type { ToolContext } from "./context";
import { getToolByName } from "./registry";

export async function runReadOnlyTool(
    name: string,
    args: object,
    ctx: ToolContext,
): Promise<object> {
    if (!isAllowedToolName(name)) {
        return { ok: false, error: `Tool not allowed by policy: ${name}` };
    }
    const tool = getToolByName(name);
    if (!tool) {
        return { ok: false, error: `Unknown tool: ${name}` };
    }
    const record =
        args && typeof args === "object" && !Array.isArray(args)
            ? (args as Record<string, unknown>)
            : {};
    return tool.execute(ctx, record);
}
