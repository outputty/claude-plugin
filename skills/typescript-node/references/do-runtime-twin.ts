export function assertLowercaseName(name: string): void {
  const lower = name.toLowerCase();
  if (name !== lower) throw new Error(`names are lowercase: write '${lower}'`);
}
