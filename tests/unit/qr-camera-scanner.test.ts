import { describe, expect, it } from "vitest";

import { getCameraErrorMessage } from "@/components/qr-camera-scanner";

describe("QR camera fallback", () => {
  it("explains permission denial without removing manual validation", () => {
    expect(getCameraErrorMessage(new DOMException("", "NotAllowedError"))).toContain(
      "código manual",
    );
  });

  it("explains when no camera is available", () => {
    expect(getCameraErrorMessage(new DOMException("", "NotFoundError"))).toContain(
      "Nenhuma câmera",
    );
  });
});
