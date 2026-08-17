const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

export function isValidPhone(phone) {
  return typeof phone === "string" && phone.replace(/\D/g, "").length >= 7;
}

export function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}

export function isValidOtp(code) {
  return typeof code === "string" && /^\d{6}$/.test(code.trim());
}

export function isValidMessage(message) {
  return typeof message === "string" && message.trim().length >= 10;
}
