import "@testing-library/jest-dom/vitest";

if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
      const handler = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        const cancelEvent = new Event("cancel", { cancelable: true });
        this.dispatchEvent(cancelEvent);
        if (!cancelEvent.defaultPrevented) {
          this.removeAttribute("open");
        }
        document.removeEventListener("keydown", handler, true);
      };
      document.addEventListener("keydown", handler, true);
      (this as HTMLDialogElement & { __escapeHandler?: (e: KeyboardEvent) => void }).__escapeHandler =
        handler;
    };
  }

  const originalClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    if (originalClose) originalClose.call(this);
  };
}