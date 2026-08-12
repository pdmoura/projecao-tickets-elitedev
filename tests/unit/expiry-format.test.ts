import { describe, expect, it } from "vitest";

import { formatCardExpiry } from "@/modules/checkout/expiry-format";

describe("card expiry formatting", () => {
  it.each([
    ["1", "1"],
    ["12", "12"],
    ["123", "12/3"],
    ["1230", "12/30"],
    ["12/30", "12/30"],
    [" 1a2-3/045 ", "12/30"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatCardExpiry(input)).toBe(expected);
  });
});
