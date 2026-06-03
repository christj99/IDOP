import { createHash, createHmac } from "node:crypto";

import type { JourneySeedMaterial, JourneySeedResult } from "./types.js";

export function createJourneySeed(material: JourneySeedMaterial): JourneySeedResult {
  const message = [
    material.capsuleId,
    material.launchTimeUtc,
    material.coarseRegionId,
    material.intentId,
    material.journeyNonce,
  ].join("\u241f");
  const journeySeed = createHmac("sha256", material.serverSecret).update(message).digest("hex");
  const seedHash = createHash("sha256").update(journeySeed, "hex").digest("hex");

  return {
    journeySeed,
    seedHash,
    secretVersion: material.secretVersion,
  };
}
