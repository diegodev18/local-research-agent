export type StepEvent =
    | {
          type: "tool_call";
          name: string;
          args: Record<string, unknown>;
      }
    | {
          type: "tool_result";
          name: string;
          ok: boolean;
          summary: string;
      }
    | {
          type: "assistant_text";
          text: string;
      }
    | {
          type: "final";
          reply: string;
      }
    | {
          type: "error";
          message: string;
      };

export type AgentRunRecord = {
    id: string;
    steps: StepEvent[];
};
