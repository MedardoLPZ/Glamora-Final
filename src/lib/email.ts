// src/lib/email.ts
const EMAIL_ENDPOINT =
  (import.meta as any).env?.VITE_EMAIL_ENDPOINT || ""; // opcional

export type ConfirmationEmailPayload = {
  customerName: string;
  serviceName: string;
  appointmentDate: string; // p.ej. 'YYYY-MM-DD'
  appointmentTime: string; // p.ej. 'HH:mm'
  toEmail?: string;
};

// 👇 Export **con nombre** (match con tu import { sendConfirmationEmail } ...)
export async function sendConfirmationEmail(
  payload: ConfirmationEmailPayload
): Promise<void> {
  // Si no tienes endpoint aún, no rompas el flujo
  if (!EMAIL_ENDPOINT) {
    console.warn("[email] VITE_EMAIL_ENDPOINT no configurado. Se omite envío.");
    return;
  }

  const res = await fetch(EMAIL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Propaga error para que tu try/catch muestre el toast
    let msg = `${res.status} ${res.statusText}`;
    try { msg = await res.text(); } catch {}
    throw new Error(msg);
  }
}
