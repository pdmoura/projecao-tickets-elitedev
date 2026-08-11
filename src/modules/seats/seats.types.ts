export type EventSeat = {
  id: string;
  label: string;
  rowLabel: string;
  seatNumber: number;
  status: "AVAILABLE" | "SOLD";
};
