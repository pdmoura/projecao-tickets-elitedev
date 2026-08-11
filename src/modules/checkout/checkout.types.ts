export type SimulatedCardInput = {
  cardNumber: string;
  cvv: string;
  expiry: string;
  method: "SIMULATED_CARD";
};

export type CheckoutInput = {
  eventId: string;
  payment: SimulatedCardInput;
  seatIds: string[];
};

export type CheckoutTicket = {
  id: string;
  seatLabel: string;
};

export type ApprovedCheckout = {
  paymentStatus: "APPROVED";
  reservationId: string;
  tickets: CheckoutTicket[];
  totalCents: number;
};
