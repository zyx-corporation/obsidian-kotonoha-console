import type { Proposal } from "../domain/types";

export interface ProposalViewActions {
  onApply: () => void;
  onReject: () => void;
  onCopy: () => void;
}

export class ProposalView {
  constructor(
    host: HTMLElement,
    proposal: Proposal,
    actions: ProposalViewActions,
  ) {
    host.createEl("h3", { text: "Proposal" });
    if (proposal.summary) {
      host.createEl("p", { cls: "kotonoha-console-muted", text: proposal.summary });
    }
    if (proposal.uncertaintyNote) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: proposal.uncertaintyNote,
      });
    }
    const pre = host.createEl("pre", { cls: "kotonoha-console-pre" });
    pre.setText(proposal.proposedText);

    const bar = host.createDiv({ cls: "kotonoha-console-actions" });
    bar.createEl("button", { text: "Apply" }).addEventListener("click", actions.onApply);
    bar.createEl("button", { text: "Reject" }).addEventListener("click", actions.onReject);
    bar.createEl("button", { text: "Copy" }).addEventListener("click", actions.onCopy);
  }
}
