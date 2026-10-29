/**
 * Serialise manual saves, autosaves, previews and approvals against the same
 * workspace revision. A follower waits for the active write, then persists
 * any edits made while that write was pending. Never perform two concurrent
 * compare-and-swap writes for one editor session.
 */
export class SaveCoordinator {
  private active: Promise<boolean> | null = null;

  async flush(
    persist: () => Promise<boolean>,
    hasUnsavedChanges: () => boolean,
  ): Promise<boolean> {
    if (this.active) {
      if (!(await this.active)) return false;
      // A completed autosave is sufficient if no newer edits exist.
      // Otherwise save the latest revision before preview/approval.
      return !hasUnsavedChanges() || this.flush(persist, hasUnsavedChanges);
    }
    const task = persist();
    this.active = task;
    try {
      return await task;
    } finally {
      if (this.active === task) this.active = null;
    }
  }
}
