import "server-only";
import { getPublicClient } from "@/lib/supabase/client";
import { configSchema } from "@/lib/config";
import type { PublicInvitation } from "@/lib/types";
export async function getInvitation(
  token?: string,
): Promise<PublicInvitation | null> {
  const db = getPublicClient();
  if (!db) return null;
  if (
    token &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  )
    return null;
  const { data, error } = await db.rpc(
    token ? "get_invitation" : "get_public_wedding",
    token
      ? { invite_token: token }
      : { wedding_slug: process.env.NEXT_PUBLIC_WEDDING_SLUG || "ale-juan" },
  );
  if (error)
    throw new Error("No se pudo cargar la invitación. Inténtalo más tarde.");
  if (!data) return null;
  return {
    ...data,
    config: configSchema.parse(data.config),
  } as PublicInvitation;
}
