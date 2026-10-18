import { optimizePhoto } from "@/lib/image";
import { getBrowserClient } from "@/lib/supabase/client";
import { configSchema, defaultConfig, type WeddingConfig } from "@/lib/config";
import type {
  Asset,
  AssetKind,
  Wedding,
  Group,
  Guest,
  WeddingTable,
} from "@/lib/types";
function fail(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new Error(
      "Ya existe un registro con ese nombre. Usa otro nombre o revisa el proyecto existente.",
    );
  if (error.code === "42501")
    throw new Error("Tu sesión no tiene permiso para realizar este cambio.");
  throw new Error(error.message);
}
export async function loadWedding() {
  const db = getBrowserClient();
  const { data, error } = await db
    .from("weddings")
    .select("*")
    .eq("slug", process.env.NEXT_PUBLIC_WEDDING_SLUG || "ale-juan")
    .maybeSingle();
  fail(error);
  if (!data) return null;
  return { ...data, config: configSchema.parse(data.config) } as Wedding;
}
export async function createWedding() {
  const db = getBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  fail(authError);
  if (!user) throw new Error("Inicia sesión.");
  const { data, error } = await db
    .from("weddings")
    .insert({
      slug: process.env.NEXT_PUBLIC_WEDDING_SLUG || "ale-juan",
      owner_id: user.id,
      config: defaultConfig,
    })
    .select()
    .single();
  fail(error);
  return data as Wedding;
}
export async function saveWedding(
  wedding: Wedding,
  config: WeddingConfig,
  publish: boolean,
) {
  const parsed = configSchema.parse(config);
  const { data, error } = await getBrowserClient().rpc("save_wedding", {
    wid: wedding.id,
    expected_version: wedding.version,
    new_config: parsed,
    make_public: publish,
  });
  fail(error);
  return data as Wedding;
}
export async function unpublishWedding(wedding: Wedding) {
  const { data, error } = await getBrowserClient().rpc("unpublish_wedding", {
    wid: wedding.id,
    expected_version: wedding.version,
  });
  fail(error);
  return data as Wedding;
}
export async function loadAdminData(id: string) {
  const db = getBrowserClient();
  const results = await Promise.all([
    db
      .from("invitation_groups")
      .select("*")
      .eq("wedding_id", id)
      .order("created_at"),
    db.from("guests").select("*").eq("wedding_id", id).order("created_at"),
    db.from("wedding_tables").select("*").eq("wedding_id", id).order("name"),
    db.from("assets").select("*").eq("wedding_id", id).order("created_at"),
  ]);
  results.forEach((r) => fail(r.error));
  return {
    groups: results[0].data as Group[],
    guests: results[1].data as Guest[],
    tables: results[2].data as WeddingTable[],
    assets: results[3].data as Asset[],
  };
}
export async function createGroup(wid: string, name: string, seats: number) {
  const { error } = await getBrowserClient().rpc("create_invitation_group", {
    wid,
    group_name: name,
    seat_count: seats,
  });
  fail(error);
}
export async function deleteGroup(id: string) {
  const { error } = await getBrowserClient()
    .from("invitation_groups")
    .delete()
    .eq("id", id);
  fail(error);
}
export async function updateGuest(
  id: string,
  patch: Partial<Pick<Guest, "name" | "table_id">>,
) {
  const { error } = await getBrowserClient()
    .from("guests")
    .update(patch)
    .eq("id", id);
  fail(error);
}
export async function createTable(wid: string, name: string, capacity: number) {
  const { error } = await getBrowserClient()
    .from("wedding_tables")
    .insert({ wedding_id: wid, name, capacity });
  fail(error);
}
export async function deleteTable(id: string) {
  const { error } = await getBrowserClient()
    .from("wedding_tables")
    .delete()
    .eq("id", id);
  fail(error);
}
const allowed: Record<AssetKind, string[]> = {
  photo: ["jpg", "jpeg", "png", "webp"],
  background: ["jpg", "jpeg", "png", "webp"],
  font: ["woff", "woff2", "ttf", "otf"],
};
export async function uploadAsset(wid: string, file: File, kind: AssetKind) {
  let ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!allowed[kind].includes(ext)) throw new Error("Formato no permitido.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("El archivo debe pesar menos de 10 MB.");
  if (kind === "photo") {
    file = await optimizePhoto(file);
    ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  }
  if (kind === "font") {
    const localUrl = URL.createObjectURL(file);
    try {
      await new FontFace(
        "UploadValidation",
        `url(${JSON.stringify(localUrl)})`,
      ).load();
    } catch {
      throw new Error(
        "No se pudo leer esta tipografía. Prueba con un archivo WOFF2 válido.",
      );
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }
  const db = getBrowserClient();
  const id = crypto.randomUUID();
  const path = `${wid}/${id}.${ext}`;
  const mime: Record<string, string> = {
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const { error: uploadError } = await db.storage
    .from("wedding-assets")
    .upload(path, file, { contentType: mime[ext], upsert: false });
  fail(uploadError);
  const {
    data: { publicUrl },
  } = db.storage.from("wedding-assets").getPublicUrl(path);
  const { data, error } = await db
    .from("assets")
    .insert({
      id,
      wedding_id: wid,
      kind,
      name: file.name,
      path,
      url: publicUrl,
      family: kind === "font" ? `Wedding_${id.replaceAll("-", "")}` : null,
      alt: file.name.replace(/\.[^.]+$/, ""),
    })
    .select()
    .single();
  if (error) {
    await db.storage.from("wedding-assets").remove([path]);
    fail(error);
  }
  return data as Asset;
}
