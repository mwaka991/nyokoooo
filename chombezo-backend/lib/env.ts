// Environment helpers for safe loading during build and runtime

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}
