// Helpers for the PIN-based auth system.
// Admin data lives in state.players as { name, pin? } objects —
// players with a pin are admins, others are read-only.

export function getAdmins(players) {
  return players.filter((p) => p.pin)
}

export function verifyPin(players, name, pin) {
  const player = players.find((p) => p.name === name)
  return player?.pin === pin
}

// Find the admin whose PIN matches the entered 4 digits.
// Returns the player object or undefined.
export function findAdminByPin(players, pin) {
  return players.find((p) => p.pin && p.pin === pin)
}

// Extract just the name strings for use in match forms, rankings, etc.
export function playerNames(players) {
  return players.map((p) => (typeof p === 'string' ? p : p.name))
}

// name -> photo (dataUrl) lookup, for components that only carry name
// strings (rankings, match lists) but still need to render an Avatar.
export function photoMap(players) {
  return Object.fromEntries(players.filter((p) => typeof p === 'object' && p.photo).map((p) => [p.name, p.photo]))
}
