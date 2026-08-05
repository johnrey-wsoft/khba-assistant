// Helpers for starting a new consultation and handing the first message off
// across the /chat -> /chat/[id] client navigation.

export const generateChatId = (): string => crypto.randomUUID();

// "YYYY-MM-DD HH:mm" to match the mock thread `when` format.
export const formatNow = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

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
