import type { AgentRunRecord, StepEvent } from "./types";

export function createTranscript(runId: string): {
    record: AgentRunRecord;
    push: (e: StepEvent) => void;
} {
    const steps: StepEvent[] = [];
    const record: AgentRunRecord = { id: runId, steps };
    return {
        record,
        push(e: StepEvent) {
            steps.push(e);
        },
    };
}
