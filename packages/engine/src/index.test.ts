import { describe, expect, it } from "vitest";

import { enginePackageName } from "./index.js";

describe("enginePackageName", () => {
  it("identifies the engine package for the M0 CI smoke test", () => {
    expect(enginePackageName()).toBe("@idop/engine");
  });
});
