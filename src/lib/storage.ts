'use client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadVisitorPhoto(
  visitorId: string,
  blob: Blob,
  type: 'checkin' | 'id' = 'checkin'
): Promise<string> {
  const storageRef = ref(storage, `visitors/${visitorId}/${type}.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}
