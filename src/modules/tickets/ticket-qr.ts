import "server-only";

import QRCode from "qrcode";

export function renderTicketQr(validationToken: string): Promise<string> {
  return QRCode.toDataURL(validationToken, {
    color: { dark: "#141414", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
    margin: 4,
    type: "image/png",
    width: 320,
  });
}
