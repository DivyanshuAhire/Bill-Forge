import { cookies } from "next/headers";
import { decrypt, SessionPayload } from "./jwt";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await decrypt(token);
}
