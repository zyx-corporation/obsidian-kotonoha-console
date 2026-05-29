import type { App, TFile } from "obsidian";

export class MarkdownWriter {
  constructor(private readonly app: App) {}

  async replaceNoteContent(file: TFile, newContent: string): Promise<void> {
    await this.app.vault.modify(file, newContent);
  }
}
