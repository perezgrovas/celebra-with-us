/** Test-only HTTP fixture. Not imported by the production app. SQL rules are
 * tested independently against PostgreSQL via PGlite (tests/database.test.ts). */
import { createServer } from "node:http";
import type { Asset } from "../lib/types";
import { defaultConfig } from "../lib/config";
const owner = "11111111-1111-4111-8111-111111111111";
const wid = "33333333-3333-4333-8333-333333333333";
const gid = "44444444-4444-4444-8444-444444444444";
const token = "55555555-5555-4555-8555-555555555555";
const guestId = "66666666-6666-4666-8666-666666666666";
const user = {
  id: owner,
  aud: "authenticated",
  role: "authenticated",
  email: "ale@example.test",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-10-01T00:00:00Z",
};
const config = {
  ...defaultConfig,
  rsvp: { ...defaultConfig.rsvp, deadline: "2099-01-01" },
};
const wedding = {
  id: wid,
  owner_id: owner,
  slug: "ale-juan",
  config,
  published_config: config,
  published: true,
  version: 1,
  updated_at: new Date().toISOString(),
};
let groups = [
  {
    id: gid,
    wedding_id: wid,
    display_name: "Dany y acompañante",
    seats: 2,
    token,
  },
];
let guests = [
  {
    id: guestId,
    wedding_id: wid,
    group_id: gid,
    name: "Dany",
    status: "pending",
    dietary: "",
    companion_name: "",
    table_id: null,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    wedding_id: wid,
    group_id: gid,
    name: "Acompañante 1",
    status: "pending",
    dietary: "",
    companion_name: "",
    table_id: null,
  },
];
let tables: {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
}[] = [];
const jwt = () => {
  const enc = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  return (
    enc({ alg: "HS256", typ: "JWT" }) +
    "." +
    enc({
      sub: owner,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    }) +
    ".test"
  );
};
const session = () => ({
  access_token: jwt(),
  refresh_token: "test-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user,
});
let assets: Asset[] = [];
const uploadedFiles = new Map<string, Buffer>();
const initial = {
  wedding: structuredClone(wedding),
  groups: structuredClone(groups),
  guests: structuredClone(guests),
};
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }
  const url = new URL(req.url || "/", "http://localhost");
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks);
  const input =
    req.headers["content-type"]?.includes("application/json") && raw.length
      ? JSON.parse(raw.toString())
      : {};
  const respond = (data: unknown, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  const authorized = Boolean(
    req.headers.authorization?.startsWith("Bearer ey"),
  );
  if (url.pathname === "/__reset") {
    Object.assign(wedding, structuredClone(initial.wedding));
    groups = structuredClone(initial.groups);
    guests = structuredClone(initial.guests);
    tables = [];
    assets = [];
    uploadedFiles.clear();
    respond({ ok: true });
    return;
  }
  if (url.pathname === "/health") {
    respond({ ok: true });
    return;
  }
  if (url.pathname === "/auth/v1/token") {
    respond(session());
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    respond(user);
    return;
  }
  if (url.pathname === "/auth/v1/logout") {
    respond({});
    return;
  }
  if (url.pathname === "/rest/v1/rpc/get_public_wedding") {
    respond({
      config: wedding.published_config,
      assets,
      group: null,
      guests: [],
    });
    return;
  }
  if (url.pathname === "/rest/v1/rpc/get_invitation") {
    respond(
      input.invite_token === token
        ? {
            config: wedding.published_config,
            assets,
            group: groups[0],
            guests: guests
              .filter((g) => g.group_id === gid)
              .map((g) => ({ ...g, table_name: null })),
          }
        : null,
    );
    return;
  }
  if (url.pathname === "/rest/v1/rpc/submit_rsvp") {
    guests = guests.map((g) => ({
      ...g,
      ...input.answers.find((a: { id: string }) => a.id === g.id),
    }));
    respond(true);
    return;
  }
  if (url.pathname.startsWith("/storage/v1/object/public/wedding-assets/")) {
    const path = url.pathname.replace(
      "/storage/v1/object/public/wedding-assets/",
      "",
    );
    const bytes = uploadedFiles.get(path);
    if (!bytes) {
      respond({ message: "Missing file" }, 404);
      return;
    }
    res.setHeader(
      "Content-Type",
      path.endsWith(".ttf")
        ? "font/ttf"
        : path.endsWith(".png")
          ? "image/png"
          : "image/webp",
    );
    res.end(bytes);
    return;
  }
  if (
    url.pathname.startsWith("/storage/v1/object/wedding-assets/") &&
    req.method === "POST"
  ) {
    const path = url.pathname.replace("/storage/v1/object/wedding-assets/", "");
    const boundary = req.headers["content-type"]?.match(/boundary=(.+)$/)?.[1];
    let bytes = raw;
    if (boundary) {
      const marker = Buffer.from("filename=");
      const at = raw.indexOf(marker);
      const start = raw.indexOf(Buffer.from("\r\n\r\n"), at) + 4;
      const end = raw.indexOf(Buffer.from("\r\n--" + boundary), start);
      bytes = raw.subarray(start, end);
    }
    uploadedFiles.set(path, bytes);
    respond({ Key: "wedding-assets/" + path });
    return;
  }
  if (!authorized) {
    respond({ message: "Not authorized" }, 401);
    return;
  }
  if (url.pathname === "/rest/v1/rpc/save_wedding") {
    wedding.config = input.new_config;
    if (input.make_public) wedding.published_config = input.new_config;
    wedding.version++;
    respond(wedding);
    return;
  }
  if (url.pathname === "/rest/v1/rpc/create_invitation_group") {
    const id = crypto.randomUUID();
    groups.push({
      id,
      wedding_id: wid,
      display_name: input.group_name,
      seats: input.seat_count,
      token: crypto.randomUUID(),
    });
    for (let i = 0; i < input.seat_count; i++)
      guests.push({
        id: crypto.randomUUID(),
        wedding_id: wid,
        group_id: id,
        name: i ? `Acompañante ${i}` : input.group_name,
        status: "pending",
        dietary: "",
        companion_name: "",
        table_id: null,
      });
    respond(id);
    return;
  }
  if (url.pathname === "/rest/v1/weddings") {
    respond(wedding);
    return;
  }
  if (url.pathname === "/rest/v1/assets") {
    if (req.method === "POST") {
      const asset = { ...input, created_at: new Date().toISOString() };
      assets.push(asset);
      respond(asset);
      return;
    }
    respond(assets);
    return;
  }
  if (url.pathname === "/rest/v1/invitation_groups") {
    if (req.method === "DELETE") {
      const id = url.searchParams.get("id")?.replace("eq.", "");
      groups = groups.filter((g) => g.id !== id);
      guests = guests.filter((g) => g.group_id !== id);
    }
    respond(groups);
    return;
  }
  if (url.pathname === "/rest/v1/guests") {
    if (req.method === "PATCH") {
      const id = url.searchParams.get("id")?.replace("eq.", "");
      guests = guests.map((g) => (g.id === id ? { ...g, ...input } : g));
    }
    respond(guests);
    return;
  }
  if (url.pathname === "/rest/v1/wedding_tables") {
    if (req.method === "POST")
      tables.push({ ...input, id: crypto.randomUUID() });
    respond(tables);
    return;
  }
  respond({ message: "Unknown fixture request" }, 404);
});
server.listen(54321, "127.0.0.1");
