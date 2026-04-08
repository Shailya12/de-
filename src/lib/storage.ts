import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadVisitorPhoto = async (visitorId: string, blob: Blob, type: 'checkin' | 'id') => {
  const fileName = type === 'checkin' ? 'checkin.jpg' : 'id.jpg';
  const fileRef = ref(storage, `visitors/${visitorId}/${fileName}`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
};
