import type { GenerationRequest, NoteContext, OperationType } from "../domain/types";

export class GenerationRequestService {
  create(
    context: NoteContext,
    operation: OperationType,
    instruction: string,
    language: "ja" | "en" | "zh_CN",
  ): GenerationRequest {
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      operation,
      instruction,
      context,
      language,
    };
  }
}
