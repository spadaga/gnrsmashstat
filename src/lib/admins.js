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

// Extract just the name strings for use in match forms, rankings, etc.
export function playerNames(players) {
  return players.map((p) => p.name)
}
