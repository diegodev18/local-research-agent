/** Tools allowed under the read-only research policy */
export const READ_ONLY_TOOL_NAMES = [
    "read_file",
    "search_files",
    "list_directory",
] as const;

export type ReadOnlyToolName = (typeof READ_ONLY_TOOL_NAMES)[number];

export function isAllowedToolName(name: string): name is ReadOnlyToolName {
    return (READ_ONLY_TOOL_NAMES as readonly string[]).includes(name);
}
