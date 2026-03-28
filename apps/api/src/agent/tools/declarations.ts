import type { FunctionDeclaration } from "@google/generative-ai";

import { readOnlyToolRegistry } from "./registry";

export function getGeminiFunctionDeclarations(): FunctionDeclaration[] {
    return readOnlyToolRegistry.map((t) => t.declaration);
}
