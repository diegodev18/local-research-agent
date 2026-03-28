export type ToolContext = {
    workspaceRoot: string;
    maxFileBytes: number;
    maxOutputChars: number;
    searchMaxFiles: number;
    searchMaxMatches: number;
};

export function truncateForModel(s: string, maxChars: number): string {
    if (s.length <= maxChars) return s;
    return `${s.slice(0, maxChars)}\n\n[truncated: ${s.length - maxChars} chars omitted]`;
}
