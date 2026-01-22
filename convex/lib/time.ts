export function now(): number {
  return Date.now();
}

export function timestamps() {
  const timestamp = now();
  return {
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updatedAt() {
  return {
    updatedAt: now(),
  };
}
