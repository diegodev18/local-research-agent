import {
    type FunctionDeclaration,
    SchemaType,
} from "@google/generative-ai";

import type { ReadOnlyToolName } from "../policy/read-only-policy";
import type { ToolContext } from "./context";
import { executeListDirectory } from "./impl/list-directory";
import { executeReadFile } from "./impl/read-file";
import { executeSearchFiles } from "./impl/search-files";

export type RegisteredTool = {
    name: ReadOnlyToolName;
    declaration: FunctionDeclaration;
    execute: (
        ctx: ToolContext,
        args: Record<string, unknown>,
    ) => Promise<object>;
};

export const readOnlyToolRegistry: RegisteredTool[] = [
    {
        name: "read_file",
        declaration: {
            name: "read_file",
            description:
                "Read the full text of a file under the workspace (UTF-8). Use for small/medium files after you know the path.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    path: {
                        type: SchemaType.STRING,
                        description:
                            "Path relative to workspace root, or absolute path inside the workspace",
                    },
                },
                required: ["path"],
            },
        },
        execute: executeReadFile,
    },
    {
        name: "search_files",
        declaration: {
            name: "search_files",
            description:
                "Search file contents under a directory (like grep). Skips heavy dirs such as node_modules and .git by default.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    pattern: {
                        type: SchemaType.STRING,
                        description:
                            "Text or regex pattern to find in each line",
                    },
                    path: {
                        type: SchemaType.STRING,
                        description:
                            "Directory to search under (relative to workspace). Defaults to workspace root.",
                    },
                    useRegex: {
                        type: SchemaType.BOOLEAN,
                        description:
                            "If true, pattern is treated as a JavaScript regex (case-insensitive, multiline)",
                    },
                    extensions: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description:
                            "Optional file extensions without dot, e.g. [\"ts\",\"tsx\"]",
                    },
                },
                required: ["pattern"],
            },
        },
        execute: executeSearchFiles,
    },
    {
        name: "list_directory",
        declaration: {
            name: "list_directory",
            description:
                "List files and directories under a path up to a max depth (breadth-first style listing).",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    path: {
                        type: SchemaType.STRING,
                        description:
                            "Directory relative to workspace root (default \".\")",
                    },
                    maxDepth: {
                        type: SchemaType.INTEGER,
                        description:
                            "Maximum directory depth from the given path (0 = only immediate children)",
                    },
                },
            },
        },
        execute: executeListDirectory,
    },
];

const byName = new Map(
    readOnlyToolRegistry.map((t) => [t.name, t] as const),
);

export function getToolByName(name: string): RegisteredTool | undefined {
    return byName.get(name as ReadOnlyToolName);
}
