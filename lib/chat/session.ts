// Helpers for starting a new consultation and handing the first message off
// across the /chat -> /chat/[id] client navigation.

export const generateChatId = (): string => crypto.randomUUID();

// The first message is typed on /chat but must be sent on /chat/[id].
// Stash it here (module scope survives client-side navigation) and let the
// destination pane consume it once on mount.
let pending: { id: string; text: string } | null = null;

export const stashPendingMessage = (id: string, text: string): void => {
  pending = { id, text };
};

export const takePendingMessage = (id: string): string | null => {
  if (pending?.id === id) {
    const { text } = pending;
    pending = null;
    return text;
  }
  return null;
};
