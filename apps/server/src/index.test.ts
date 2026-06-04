import { describe, expect, it } from "vitest";

import { isEntrypointModule } from "./index.js";

describe("server entrypoint detection", () => {
  it("recognizes the server module when tsx passes a Windows file path", () => {
    expect(
      isEntrypointModule(
        "file:///C:/Users/chris/Documents/IDOP/apps/server/src/index.ts",
        "C:\\Users\\chris\\Documents\\IDOP\\apps\\server\\src\\index.ts",
      ),
    ).toBe(true);
  });
});
