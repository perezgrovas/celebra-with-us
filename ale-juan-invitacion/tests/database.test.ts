import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { defaultConfig } from "../lib/config";
const owner = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";
test("database RLS, scoped RSVP, publication, versioning and table constraints", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;`,
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.query("insert into auth.users values($1),($2)", [owner, stranger]);
    const role = async (who: "owner" | "stranger" | "anon" | "root") => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        who === "owner" ? owner : who === "stranger" ? stranger : "",
      ]);
      if (who !== "root")
        await db.exec(`set role ${who === "anon" ? "anon" : "authenticated"}`);
    };
    const cfg = {
      ...defaultConfig,
      rsvp: { ...defaultConfig.rsvp, deadline: "2099-01-01" },
    };
    await role("owner");
    const w = (
      await db.query<{ id: string }>(
        "insert into public.weddings(owner_id,slug,config) values($1,$2,$3) returning id",
        [owner, "ale-juan", cfg],
      )
    ).rows[0].id;
    await t.test("unpublished config is not public", async () => {
      await role("anon");
      assert.equal(
        (
          await db.query<{ data: unknown }>(
            "select public.get_public_wedding('ale-juan') as data",
          )
        ).rows[0].data,
        null,
      );
      await assert.rejects(
        () => db.query("select * from public.weddings"),
        /permission denied/,
      );
    });
    await role("owner");
    const saved = (
      await db.query<{ data: { id: string; version: number } }>(
        "select public.save_wedding($1,1,$2,true) as data",
        [w, cfg],
      )
    ).rows[0].data;
    assert.equal(saved.id, w);
    assert.equal(saved.version, 2);
    const gid = (
      await db.query<{ id: string }>(
        "select public.create_invitation_group($1,$2,2) as id",
        [w, "Dany"],
      )
    ).rows[0].id;
    const group = (
      await db.query<{ token: string }>(
        "select token from public.invitation_groups where id=$1",
        [gid],
      )
    ).rows[0];
    const guests = (
      await db.query<{ id: string }>(
        "select id from public.guests where group_id=$1 order by created_at,id",
        [gid],
      )
    ).rows;
    const second = (
      await db.query<{ id: string }>(
        "select public.create_invitation_group($1,$2,1) as id",
        [w, "Sofi"],
      )
    ).rows[0].id;
    const otherGuest = (
      await db.query<{ id: string }>(
        "select id from public.guests where group_id=$1",
        [second],
      )
    ).rows[0].id;
    const answers = guests.map((g) => ({
      id: g.id,
      status: "attending",
      dietary: "",
      companion_name: "",
    }));
    await t.test(
      "other owners cannot read or mutate this wedding",
      async () => {
        await role("stranger");
        assert.equal(
          (await db.query("select * from public.weddings")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.guests")).rows.length,
          0,
        );
        await assert.rejects(
          () => db.query("select public.save_wedding($1,2,$2,true)", [w, cfg]),
          /No tienes acceso/,
        );
      },
    );
    await t.test(
      "anonymous guest can only read the token-scoped passes",
      async () => {
        await role("anon");
        const invitation = (
          await db.query<{ data: { guests: { id: string }[] } }>(
            "select public.get_invitation($1) as data",
            [group.token],
          )
        ).rows[0].data;
        assert.equal(invitation.guests.length, 2);
        assert.equal(
          invitation.guests.some((g) => g.id === otherGuest),
          false,
        );
        await assert.rejects(
          () => db.query("select * from public.guests"),
          /permission denied/,
        );
      },
    );
    await t.test(
      "RSVP rejects foreign passes, duplicates, invalid statuses and partial answers",
      async () => {
        await role("anon");
        await assert.rejects(
          () =>
            db.query("select public.submit_rsvp($1,$2)", [
              group.token,
              [{ ...answers[0], id: otherGuest }, answers[1]],
            ]),
          /Pase no disponible/,
        );
        await assert.rejects(
          () =>
            db.query("select public.submit_rsvp($1,$2)", [
              group.token,
              [answers[0], answers[0]],
            ]),
          /duplicados/,
        );
        await assert.rejects(
          () =>
            db.query("select public.submit_rsvp($1,$2)", [
              group.token,
              [answers[0]],
            ]),
          /todos los pases/,
        );
        await assert.rejects(
          () =>
            db.query("select public.submit_rsvp($1,$2)", [
              group.token,
              answers.map((a) => ({ ...a, status: "bad" })),
            ]),
          /Selecciona asistencia/,
        );
      },
    );
    await t.test("RSVP is atomic and rejects oversize inputs", async () => {
      await role("anon");
      await assert.rejects(
        () =>
          db.query("select public.submit_rsvp($1,$2)", [
            group.token,
            [answers[0], { ...answers[1], dietary: "x".repeat(1001) }],
          ]),
        /check constraint/,
      );
      await role("owner");
      assert.equal(
        (
          await db.query<{ status: string }>(
            "select status from public.guests where group_id=$1",
            [gid],
          )
        ).rows.every((g) => g.status === "pending"),
        true,
      );
      await role("anon");
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            "select public.submit_rsvp($1,$2) as ok",
            [group.token, answers],
          )
        ).rows[0].ok,
        true,
      );
      await assert.rejects(
        () =>
          db.query("select public.submit_rsvp($1,$2)", [group.token, answers]),
        /Espera unos segundos/,
      );
    });
    await t.test(
      "assignment cannot exceed capacity or cross weddings",
      async () => {
        await role("owner");
        const table = (
          await db.query<{ id: string }>(
            "insert into public.wedding_tables(wedding_id,name,capacity) values($1,$2,1) returning id",
            [w, "Mesa 1"],
          )
        ).rows[0].id;
        await db.query("update public.guests set table_id=$1 where id=$2", [
          table,
          guests[0].id,
        ]);
        await assert.rejects(
          () =>
            db.query("update public.guests set table_id=$1 where id=$2", [
              table,
              guests[1].id,
            ]),
          /completa/,
        );
        await role("root");
        const w2 = (
          await db.query<{ id: string }>(
            "insert into public.weddings(owner_id,slug,config) values($1,$2,$3) returning id",
            [stranger, "otra-boda", cfg],
          )
        ).rows[0].id;
        const t2 = (
          await db.query<{ id: string }>(
            "insert into public.wedding_tables(wedding_id,name,capacity) values($1,$2,2) returning id",
            [w2, "Mesa ajena"],
          )
        ).rows[0].id;
        await role("owner");
        await assert.rejects(
          () =>
            db.query("update public.guests set table_id=$1 where id=$2", [
              t2,
              guests[1].id,
            ]),
          /no disponible/,
        );
      },
    );
    await t.test(
      "draft does not leak, save requires latest version",
      async () => {
        await role("owner");
        const draft = {
          ...cfg,
          couple: { ...cfg.couple, bride: "Nuevo borrador" },
        };
        await db.query("select public.save_wedding($1,2,$2,false)", [w, draft]);
        await assert.rejects(
          () => db.query("select public.save_wedding($1,2,$2,true)", [w, cfg]),
          /más reciente/,
        );
        await role("anon");
        const publicWedding = (
          await db.query<{ data: { config: typeof cfg } }>(
            "select public.get_public_wedding('ale-juan') as data",
          )
        ).rows[0].data;
        assert.equal(publicWedding.config.couple.bride, "Ale");
      },
    );
    await t.test("published rules enforce deadline and no edits", async () => {
      await role("owner");
      await db.query("select public.save_wedding($1,3,$2,true)", [
        w,
        { ...cfg, rsvp: { ...cfg.rsvp, deadline: "2000-01-01" } },
      ]);
      await role("anon");
      await assert.rejects(
        () =>
          db.query("select public.submit_rsvp($1,$2)", [group.token, answers]),
        /terminado/,
      );
      await role("owner");
      await db.query("select public.save_wedding($1,4,$2,true)", [
        w,
        { ...cfg, rsvp: { ...cfg.rsvp, allowChanges: false } },
      ]);
      await role("root");
      await db.query(
        "update public.invitation_groups set last_rsvp_at=now()-interval '10 seconds' where id=$1",
        [gid],
      );
      await role("anon");
      await assert.rejects(
        () =>
          db.query("select public.submit_rsvp($1,$2)", [group.token, answers]),
        /ya fue registrada/,
      );
    });
    await t.test("storage upload is scoped to owner", async () => {
      await role("stranger");
      await assert.rejects(
        () =>
          db.query(
            "insert into storage.objects(bucket_id,name) values('wedding-assets',$1)",
            [`${w}/x.png`],
          ),
        /row-level security/,
      );
      await role("owner");
      await db.query(
        "insert into storage.objects(bucket_id,name) values('wedding-assets',$1)",
        [`${w}/x.png`],
      );
    });
    await t.test(
      "published assets are scoped and unreferenced uploads stay out of the payload",
      async () => {
        const photo = "88888888-8888-4888-8888-888888888888";
        const font = "99999999-9999-4999-8999-999999999999";
        const unused = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
        const family = "Wedding_" + font.replaceAll("-", "");
        await role("owner");
        for (const [id, kind, ext, fam] of [
          [photo, "photo", "webp", null],
          [font, "font", "woff2", family],
          [unused, "photo", "webp", null],
        ]) {
          await db.query(
            "insert into public.assets(id,wedding_id,kind,name,path,url,family) values($1,$2,$3,$4,$5,$6,$7)",
            [
              id,
              w,
              kind,
              "Test",
              `${w}/${id}.${ext}`,
              `https://example.test/${id}.${ext}`,
              fam,
            ],
          );
        }
        const withAssets = {
          ...cfg,
          gallery: [photo],
          fonts: { ...cfg.fonts, title: family },
        };
        await assert.rejects(
          () =>
            db.query("select public.save_wedding($1,5,$2,false)", [
              w,
              { ...cfg, gallery: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"] },
            ]),
          /Foto no disponible/,
        );
        await db.query("select public.save_wedding($1,5,$2,true)", [
          w,
          withAssets,
        ]);
        await role("anon");
        const payload = (
          await db.query<{ data: { assets: { id: string }[] } }>(
            "select public.get_public_wedding('ale-juan') as data",
          )
        ).rows[0].data;
        assert.deepEqual(
          new Set(payload.assets.map((a) => a.id)),
          new Set([photo, font]),
        );
        await role("owner");
        await db.query(
          "insert into storage.objects(bucket_id,name) values('wedding-assets',$1)",
          [`${w}/${photo}.webp`],
        );
        await db.query("delete from storage.objects where name=$1", [
          `${w}/${photo}.webp`,
        ]);
        assert.equal(
          (
            await db.query("select * from storage.objects where name=$1", [
              `${w}/${photo}.webp`,
            ])
          ).rows.length,
          1,
        );
      },
    );
    await t.test("unpublish revokes token access", async () => {
      await role("owner");
      await db.query("select public.unpublish_wedding($1,6)", [w]);
      await role("anon");
      assert.equal(
        (
          await db.query<{ data: unknown }>(
            "select public.get_invitation($1) as data",
            [group.token],
          )
        ).rows[0].data,
        null,
      );
    });
  } finally {
    await db.close();
  }
});
