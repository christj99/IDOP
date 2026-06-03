import { createHmac } from "node:crypto";

export function roll(
  journeySeed: string,
  phase: string,
  tickIndex: number,
  ruleId: string,
): number {
  const digest = createHmac("sha256", Buffer.from(journeySeed, "hex"))
    .update(`${phase}\u241f${tickIndex}\u241f${ruleId}`)
    .digest();
  const integer = digest.readBigUInt64BE(0);

  return Number(integer) / 2 ** 64;
}
