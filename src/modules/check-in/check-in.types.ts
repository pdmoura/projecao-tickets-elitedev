export type CheckInTicketPresentation = {
  eventTitle: string;
  holderName: string;
  seatLabel: string;
};

export type ValidCheckInResult = {
  result: "VALID";
  ticket: CheckInTicketPresentation;
  validatedAt: string;
};

export type InvalidCheckInResult = {
  result: "INVALID";
};

export type AlreadyUsedCheckInResult = {
  result: "ALREADY_USED";
  usedAt: string;
};

export type WrongEventCheckInResult = {
  result: "WRONG_EVENT";
  ticketEvent: {
    id: string;
    title: string;
  };
};

export type CheckInResult =
  | ValidCheckInResult
  | InvalidCheckInResult
  | AlreadyUsedCheckInResult
  | WrongEventCheckInResult;

export type ManualCheckInInput = {
  code: string;
  eventId: string;
};

export type QrCheckInInput = {
  eventId: string;
  token: string;
};
