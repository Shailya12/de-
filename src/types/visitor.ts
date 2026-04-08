import { Timestamp } from "firebase/firestore";

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  idPhotoUrl?: string;
  purpose: 'Delivery' | 'Guest' | 'Meeting' | 'Maintenance' | 'Other';
  hostName?: string;
  apartmentFloor?: string;
  vehicleNumber?: string;
  notes?: string;
  checkInTime: Timestamp;
  checkOutTime?: Timestamp;
  status: 'checked-in' | 'checked-out';
  checkedInBy: string;
  checkedInByName: string;
  flagged: boolean;
}

export interface BlocklistedVisitor {
  id: string;
  name: string;
  phone: string;
  reason: string;
  addedBy: string;
  addedAt: Timestamp;
}
