import { describe, expect, it } from "vitest";

import { CheckInValidationError } from "@/modules/check-in/check-in.errors";
import {
  parseManualCheckInInput,
  parseQrCheckInInput,
} from "@/modules/check-in/check-in.schemas";

describe("check-in input", () => {
  it("parses separate manual-code and QR contracts", () => {
    expect(
      parseManualCheckInInput({ code: " abcd-1234-wxyz ", eventId: " event-1 " }),
    ).toEqual({ code: "abcd-1234-wxyz", eventId: "event-1" });
    expect(
      parseQrCheckInInput({ eventId: "event-1", token: " opaque-token " }),
    ).toEqual({ eventId: "event-1", token: "opaque-token" });
  });

  it("rejects missing event and credential fields", () => {
    expect(() => parseManualCheckInInput({ code: "ABCD" })).toThrow(
      CheckInValidationError,
    );
    expect(() => parseQrCheckInInput({ eventId: "event-1" })).toThrow(
      CheckInValidationError,
    );
  });
});
