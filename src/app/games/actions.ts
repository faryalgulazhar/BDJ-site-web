"use server";

import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

/**
 * Note: These are structured as Server Actions, but since we are using 
 * the client-side Firebase SDK, these will still mostly run on the client 
 * because 'db' is initialized with client-side config. 
 * For true Server Actions, one would typically use 'firebase-admin'.
 */

export async function deleteSessionAction(id: string) {
  try {
    await deleteDoc(doc(db, "sessions", id));
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: deleteSession", error);
    return { success: false, error: "Failed to delete session" };
  }
}

export async function approveSessionAction(id: string) {
  try {
    await updateDoc(doc(db, "sessions", id), { approval: "approved" });
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: approveSession", error);
    return { success: false, error: "Failed to approve session" };
  }
}

export async function updateSessionAction(id: string, data: any) {
  try {
    await updateDoc(doc(db, "sessions", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: updateSession", error);
    return { success: false, error: "Failed to update session" };
  }
}

// ── Admin Tasks ──

export async function createTaskAction(data: { content: string; author: string }) {
  try {
    await addDoc(collection(db, "admin_tasks"), {
      ...data,
      completed: false,
      createdAt: serverTimestamp(),
    });
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: createTask", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function deleteTaskAction(id: string) {
  try {
    await deleteDoc(doc(db, "admin_tasks", id));
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: deleteTask", error);
    return { success: false, error: "Failed to delete task" };
  }
}

export async function toggleTaskAction(id: string, completed: boolean) {
  try {
    await updateDoc(doc(db, "admin_tasks", id), { completed });
    revalidatePath("/games");
    return { success: true };
  } catch (error) {
    console.error("Action Error: toggleTask", error);
    return { success: false, error: "Failed to toggle task" };
  }
}

