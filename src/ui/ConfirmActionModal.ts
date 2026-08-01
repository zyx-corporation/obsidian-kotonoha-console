import { type App, ButtonComponent, Modal } from "obsidian";
import { consoleMsg } from "../i18n/consoleI18n";
import type { RdeLang } from "../rde/rdeI18n";

export function confirmConsoleAction(
  app: App,
  lang: RdeLang,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmActionModal(app, lang, message, resolve).open();
  });
}

class ConfirmActionModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly lang: RdeLang,
    private readonly message: string,
    private readonly resolve: (confirmed: boolean) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(consoleMsg(this.lang, "confirmDialogTitle"));
    this.contentEl.empty();
    this.contentEl.createEl("p", { text: this.message });

    const actions = this.contentEl.createDiv({
      cls: "kotonoha-console-modal-actions",
    });
    new ButtonComponent(actions)
      .setButtonText(consoleMsg(this.lang, "confirmDialogCancel"))
      .onClick(() => {
        this.finish(false);
      });
    new ButtonComponent(actions)
      .setButtonText(consoleMsg(this.lang, "confirmDialogContinue"))
      .setCta()
      .onClick(() => {
        this.finish(true);
      });
  }

  onClose(): void {
    this.finish(false, false);
  }

  private finish(confirmed: boolean, closeModal = true): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolve(confirmed);
    if (closeModal) {
      this.close();
    }
  }
}
