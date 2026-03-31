'use client'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
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

export async function addVisitor(data: NewVisitorData): Promise<string> {
  const ref = await addDoc(collection(db, 'visitors'), {
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

function toVisitor(id: string, data: Record<string, unknown>): Visitor {
  return {
    id,
    name: data.name as string,
    phone: data.phone as string,
    photoUrl: data.photoUrl as string,
    idPhotoUrl: data.idPhotoUrl as string | undefined,
    purpose: data.purpose as VisitPurpose,
    hostName: data.hostName as string | undefined,
    apartmentFloor: data.apartmentFloor as string | undefined,
    vehicleNumber: data.vehicleNumber as string | undefined,
    notes: data.notes as string | undefined,
    checkInTime: (data.checkInTime as Timestamp).toDate(),
    checkOutTime: data.checkOutTime ? (data.checkOutTime as Timestamp).toDate() : undefined,
    status: data.status as 'checked-in' | 'checked-out',
    checkedInBy: data.checkedInBy as string,
    checkedInByName: data.checkedInByName as string,
    flagged: data.flagged as boolean,
  }
}

export function subscribeToVisitors(callback: (visitors: Visitor[]) => void): Unsubscribe {
  const q = query(collection(db, 'visitors'), orderBy('checkInTime', 'desc'))
  return onSnapshot(q, (snap) => {
    const visitors = snap.docs.map((d) => toVisitor(d.id, d.data()))
    callback(visitors)
  })
}

export async function getVisitorsByPhone(phone: string): Promise<Visitor[]> {
  const q = query(collection(db, 'visitors'), where('phone', '==', phone), orderBy('checkInTime', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVisitor(d.id, d.data()))
}

export async function getRecentVisitors(limit = 10): Promise<Visitor[]> {
  const q = query(collection(db, 'visitors'), orderBy('checkInTime', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.slice(0, limit).map((d) => toVisitor(d.id, d.data()))
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
  await updateDoc(doc(db, 'blocklist', entryId), { removed: true })
}

export async function getBlocklist(): Promise<BlocklistEntry[]> {
  const snap = await getDocs(collection(db, 'blocklist'))
  return snap.docs
    .filter((d) => !d.data().removed)
    .map((d) => ({
      id: d.id,
      name: d.data().name as string,
      phone: d.data().phone as string,
      reason: d.data().reason as string,
      addedBy: d.data().addedBy as string,
      addedAt: (d.data().addedAt as Timestamp).toDate(),
    }))
}

export function subscribeToBlocklist(callback: (entries: BlocklistEntry[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'blocklist'), (snap) => {
    const entries = snap.docs
      .filter((d) => !d.data().removed)
      .map((d) => ({
        id: d.id,
        name: d.data().name as string,
        phone: d.data().phone as string,
        reason: d.data().reason as string,
        addedBy: d.data().addedBy as string,
        addedAt: (d.data().addedAt as Timestamp).toDate(),
      }))
    callback(entries)
  })
}
