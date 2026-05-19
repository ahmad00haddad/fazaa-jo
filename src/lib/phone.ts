// Jordanian phone helpers — unified 962 format.
// Mobile numbers in Jordan are 9 digits starting with 7 (after the 962 country code).
// Examples accepted: "0791234567", "+962791234567", "962791234567", "791234567"
// All become: "962791234567"

export function normalizeJordanPhone(input: string): string {
  if (!input) return "";
  let digits = input.replace(/\D/g, "");
  if (!digits) return "";
  digits = digits.replace(/^00/, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = "962" + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith("7")) {
    digits = "962" + digits;
  }
  return digits;
}

export function isValidJordanPhone(input: string): boolean {
  const n = normalizeJordanPhone(input);
  // 962 + 7 + 8 digits = 12 chars total
  return /^9627[7-9]\d{7}$/.test(n);
}

export function formatJordanPhoneDisplay(input: string): string {
  const n = normalizeJordanPhone(input);
  if (!isValidJordanPhone(n)) return input;
  // +962 7X XXX XXXX
  return `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}

export function buildJordanWhatsAppUrl(phone: string, message?: string): string {
  const n = normalizeJordanPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${n}${text}`;
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
