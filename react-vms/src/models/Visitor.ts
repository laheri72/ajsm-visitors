export type VisitorStatus =
  | "scheduled"
  | "checked-in"
  | "checked-out";

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  purpose: string;

  scheduledDate: string;
  scheduledTime: string;
  duration: string;

  status: VisitorStatus;

  cardNumber?: string;

  checkInTime?: string | null;
  checkOutTime?: string | null;

  assignedTo?: string;
  createdAt: any;
}
