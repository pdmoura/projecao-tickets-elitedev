export type CheckoutFieldErrors = {
  cardNumber?: string;
  cvv?: string;
  expiry?: string;
};

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function validateCheckoutFields({
  cardNumber,
  cvv,
  expiry,
  now = new Date(),
}: {
  cardNumber: string;
  cvv: string;
  expiry: string;
  now?: Date;
}): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  const normalizedCardNumber = digitsOnly(cardNumber, 16);
  const normalizedCvv = digitsOnly(cvv, 3);
  const expiryDigits = digitsOnly(expiry, 4);

  if (!normalizedCardNumber) {
    errors.cardNumber = "Digite o número do cartão.";
  } else if (normalizedCardNumber.length !== 16) {
    errors.cardNumber = "Digite os 16 números do cartão.";
  }

  if (expiryDigits.length !== 4) {
    errors.expiry = "Digite a validade no formato MM/AA.";
  } else {
    const month = Number(expiryDigits.slice(0, 2));
    const year = 2_000 + Number(expiryDigits.slice(2));

    if (month < 1 || month > 12) {
      errors.expiry = "O mês deve estar entre 01 e 12.";
    } else if (
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1)
    ) {
      errors.expiry = "Este cartão está vencido.";
    }
  }

  if (normalizedCvv.length !== 3) {
    errors.cvv = "Digite os 3 números do CVV.";
  }

  return errors;
}
