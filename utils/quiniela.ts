export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function validateInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function canInviteMorePlayers(
  currentPlayers: number,
  isPremium: boolean,
  maxFree: number = 5,
  maxPremium: number = 20
): boolean {
  const max = isPremium ? maxPremium : maxFree;
  return currentPlayers < max;
}

export function getInviteLimit(isPremium: boolean): number {
  return isPremium ? 20 : 5;
}
