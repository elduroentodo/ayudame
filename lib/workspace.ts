import { supabase } from "@/lib/supabase-browser";

const selectionKey = (userId: string) => `ayudame:business:${userId}`;

export async function listBusinessIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return [...new Set((data || []).map((row) => row.business_id).filter(Boolean))];
}

export function preferredBusinessId(userId: string, businessIds: string[]): string | null {
  if (!businessIds.length) return null;
  try {
    const stored = window.localStorage.getItem(selectionKey(userId));
    if (stored && businessIds.includes(stored)) return stored;
  } catch {
    // Private browsing can block local storage; the first accessible space remains usable.
  }
  return businessIds[0];
}

export function rememberBusinessId(userId: string, businessId: string): void {
  try {
    window.localStorage.setItem(selectionKey(userId), businessId);
  } catch {
    // Selection still works for this page even if it cannot persist.
  }
}
