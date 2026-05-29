import type { ActiveNoteReader } from "../obsidian/ActiveNoteReader";
import type { NoteContext } from "../domain/types";

export class NoteContextService {
  constructor(private readonly reader: ActiveNoteReader) {}

  async capture(selectionText?: string): Promise<NoteContext | null> {
    return this.reader.readNoteContext(selectionText);
  }
}
