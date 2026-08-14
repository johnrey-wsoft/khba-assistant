// Helpers for starting a new consultation and handing the first message off
// across the /chat -> /chat/[id] client navigation.

export const generateChatId = (): string => crypto.randomUUID();

// "YYYY-MM-DD HH:mm" to match the mock thread `when` format. Accepts a Date, an
// ISO string (as timestamps arrive over JSON), or null.
export const formatWhen = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const formatNow = (): string => formatWhen(new Date());

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
