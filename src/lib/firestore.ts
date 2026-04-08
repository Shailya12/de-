import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { Visitor, BlocklistedVisitor } from "@/types/visitor";

export const visitorsCol = collection(db, "visitors");
export const blocklistCol = collection(db, "blocklist");

export const addVisitor = (data: Omit<Visitor, 'id'>) => addDoc(visitorsCol, data);

export const updateVisitorStatus = (id: string, status: 'checked-in' | 'checked-out') => {
  const visitorRef = doc(db, "visitors", id);
  return updateDoc(visitorRef, {
    status,
    checkOutTime: status === 'checked-out' ? Timestamp.now() : null
  });
};

export const flagVisitor = (id: string, flagged: boolean = true) => {
  const visitorRef = doc(db, "visitors", id);
  return updateDoc(visitorRef, { flagged });
};

export const addToBlocklist = (data: Omit<BlocklistedVisitor, 'id'>) => addDoc(blocklistCol, data);

export const removeFromBlocklist = (id: string) => deleteDoc(doc(db, "blocklist", id));
