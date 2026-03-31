export type VisitPurpose = 'Delivery' | 'Guest' | 'Meeting' | 'Maintenance' | 'Other'
export type VisitorStatus = 'checked-in' | 'checked-out'

export interface Visitor {
  id: string
  name: string
  phone: string
  photoUrl: string
  idPhotoUrl?: string
  purpose: VisitPurpose
  hostName?: string
  apartmentFloor?: string
  vehicleNumber?: string
  notes?: string
  checkInTime: Date
  checkOutTime?: Date
  status: VisitorStatus
  checkedInBy: string
  checkedInByName: string
  flagged: boolean
  visitCount?: number // populated client-side from history
}

export interface BlocklistEntry {
  id: string
  name: string
  phone: string
  reason: string
  addedBy: string
  addedAt: Date
}

export type UserRole = 'admin' | 'security'
