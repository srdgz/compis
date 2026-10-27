const USERNAME_PATTERN = /^[A-Za-z0-9]{3,20}$/;

export function isValidPaypalUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

export function paypalMeUrl(username: string, amountEuros: number): string {
  return `https://www.paypal.me/${encodeURIComponent(username)}/${amountEuros.toFixed(2)}EUR`;
}
