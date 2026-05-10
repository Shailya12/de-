'use client'
import {
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  startAfter,
  limit,
  type Unsubscribe,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Visitor, BlocklistEntry, VisitPurpose } from '@/types'

// ── Visitors ──────────────────────────────────────────────────────────────────

export interface NewVisitorData {
  name: string
  phone: string
  photoUrl: string
  idPhotoUrl?: string
  purpose: VisitPurpose
  hostName?: string
  apartmentFloor?: string
  vehicleNumber?: string
  notes?: string
  checkedInBy: string
  checkedInByName: string
}

export async function addVisitor(data: NewVisitorData, id?: string): Promise<string> {
  const ref = id ? doc(db, 'visitors', id) : doc(collection(db, 'visitors'))
  await setDoc(ref, {
    ...data,
    checkInTime: Timestamp.now(),
    status: 'checked-in',
    flagged: false,
  })
  return ref.id
}

export async function checkOutVisitor(visitorId: string): Promise<void> {
  await updateDoc(doc(db, 'visitors', visitorId), {
    status: 'checked-out',
    checkOutTime: Timestamp.now(),
  })
}

export async function flagVisitor(visitorId: string, flagged: boolean): Promise<void> {
  await updateDoc(doc(db, 'visitors', visitorId), { flagged })
}

function toVisitor(id: string, data: Record<string, unknown>): Visitor | null {
  const checkInTime = data.checkInTime as Timestamp | undefined
  if (!checkInTime?.toDate) return null
  return {
    id,
    name: (data.name as string) ?? '',
    phone: (data.phone as string) ?? '',
    photoUrl: (data.photoUrl as string) ?? '',
    idPhotoUrl: data.idPhotoUrl as string | undefined,
    purpose: (data.purpose as VisitPurpose) ?? 'Other',
    hostName: data.hostName as string | undefined,
    apartmentFloor: data.apartmentFloor as string | undefined,
    vehicleNumber: data.vehicleNumber as string | undefined,
    notes: data.notes as string | undefined,
    checkInTime: checkInTime.toDate(),
    checkOutTime: data.checkOutTime ? (data.checkOutTime as Timestamp).toDate() : undefined,
    status: (data.status as 'checked-in' | 'checked-out') ?? 'checked-in',
    checkedInBy: (data.checkedInBy as string) ?? '',
    checkedInByName: (data.checkedInByName as string) ?? 'Unknown',
    flagged: (data.flagged as boolean) ?? false,
  }
}

export function subscribeToVisitors(
  callback: (visitors: Visitor[]) => void,
  onError?: (err: Error) => void,
  maxRecords = 500
): Unsubscribe {
  const q = query(
    collection(db, 'visitors'),
    orderBy('checkInTime', 'desc'),
    limit(maxRecords)
  )
  return onSnapshot(
    q,
    (snap) => {
      const visitors = snap.docs.map((d) => toVisitor(d.id, d.data())).filter((v): v is Visitor => v !== null)
      callback(visitors)
    },
    onError ?? ((err) => console.error('subscribeToVisitors error:', err))
  )
}

export async function getVisitorsByPhone(phone: string): Promise<Visitor[]> {
  const q = query(collection(db, 'visitors'), where('phone', '==', phone), orderBy('checkInTime', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVisitor(d.id, d.data())).filter((v): v is Visitor => v !== null)
}

export async function getRecentVisitors(maxResults = 10): Promise<Visitor[]> {
  const q = query(collection(db, 'visitors'), orderBy('checkInTime', 'desc'), limit(maxResults))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVisitor(d.id, d.data())).filter((v): v is Visitor => v !== null)
}

/** Returns visitors checked in within the last N minutes with this phone who are still inside */
export async function getRecentCheckInsByPhone(phone: string, withinMinutes = 30): Promise<Visitor[]> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - withinMinutes * 60 * 1000))
  const q = query(
    collection(db, 'visitors'),
    where('phone', '==', phone),
    where('status', '==', 'checked-in'),
    where('checkInTime', '>=', cutoff),
    orderBy('checkInTime', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVisitor(d.id, d.data())).filter((v): v is Visitor => v !== null)
}

export async function getVisitorPage(
  after: DocumentSnapshot | null,
  pageSize = 100
): Promise<{ visitors: Visitor[]; lastDoc: DocumentSnapshot | null }> {
  const constraints = after
    ? [orderBy('checkInTime', 'desc'), startAfter(after), limit(pageSize)]
    : [orderBy('checkInTime', 'desc'), limit(pageSize)]
  const q = query(collection(db, 'visitors'), ...constraints)
  const snap = await getDocs(q)
  return {
    visitors: snap.docs.map((d) => toVisitor(d.id, d.data())).filter((v): v is Visitor => v !== null),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  }
}

// ── Blocklist ─────────────────────────────────────────────────────────────────

export async function addToBlocklist(data: {
  name: string
  phone: string
  reason: string
  addedBy: string
}): Promise<void> {
  await addDoc(collection(db, 'blocklist'), {
    ...data,
    addedAt: Timestamp.now(),
  })
}

export async function removeFromBlocklist(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'blocklist', entryId))
}

export async function getBlocklist(): Promise<BlocklistEntry[]> {
  const snap = await getDocs(collection(db, 'blocklist'))
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name as string,
    phone: d.data().phone as string,
    reason: d.data().reason as string,
    addedBy: d.data().addedBy as string,
    addedAt: (d.data().addedAt as Timestamp).toDate(),
  }))
}

function toBlocklistEntry(d: { id: string; data(): Record<string, unknown> }): BlocklistEntry {
  const raw = d.data()
  return {
    id: d.id,
    name: (raw.name as string) ?? '',
    phone: (raw.phone as string) ?? '',
    reason: (raw.reason as string) ?? '',
    addedBy: (raw.addedBy as string) ?? '',
    addedAt: raw.addedAt ? (raw.addedAt as Timestamp).toDate() : new Date(),
  }
}

export function subscribeToBlocklist(
  callback: (entries: BlocklistEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'blocklist'),
    (snap) => callback(snap.docs.map(toBlocklistEntry)),
    onError ?? ((err) => console.error('subscribeToBlocklist error:', err))
  )
}
