-- Fresh installation in a NEW Supabase project. Does not modify legacy tables.
-- Versioned schema; run once. All browser access is constrained by RLS or RPC.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.weddings (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=80),
 config jsonb not null,
 published_config jsonb,
 published boolean not null default false,
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 check (not published or published_config is not null)
);
create table public.invitation_groups (
 id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 1 and 120),
 token uuid not null unique default gen_random_uuid(), seats integer not null check(seats between 1 and 20),
 last_rsvp_at timestamptz,
 created_at timestamptz not null default now(), unique(id,wedding_id)
);
create table public.wedding_tables (
 id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),capacity integer not null check(capacity between 1 and 50),
 unique(id,wedding_id),unique(wedding_id,name)
);
create table public.guests (
 id uuid primary key default gen_random_uuid(),wedding_id uuid not null references public.weddings(id) on delete cascade,
 group_id uuid not null, name text not null check(length(trim(name)) between 1 and 120),
 status text not null default 'pending' check(status in ('pending','attending','declined')),
 dietary text not null default '' check(length(dietary)<=1000),companion_name text not null default '' check(length(companion_name)<=120),
 table_id uuid, updated_at timestamptz not null default now(),created_at timestamptz not null default now(),
 foreign key(group_id,wedding_id) references public.invitation_groups(id,wedding_id) on delete cascade,
 foreign key(table_id,wedding_id) references public.wedding_tables(id,wedding_id) on delete set null (table_id)
);
create table public.assets (
 id uuid primary key,wedding_id uuid not null references public.weddings(id) on delete cascade,
 kind text not null check(kind in ('photo','background','font')),name text not null check(length(name)<=255),
 path text not null unique,url text not null check(url ~ '^https://'),
 family text,alt text not null default '' check(length(alt)<=250),created_at timestamptz not null default now(),
 check(path like wedding_id::text||'/'||id::text||'.%'),
 check((kind='font' and family='Wedding_'||replace(id::text,'-','')) or (kind<>'font' and family is null))
);
create index guests_group_idx on public.guests(group_id);
create index guests_table_idx on public.guests(table_id);
create index guests_wedding_idx on public.guests(wedding_id);
create index groups_wedding_idx on public.invitation_groups(wedding_id);
create index tables_wedding_idx on public.wedding_tables(wedding_id);
create index assets_wedding_idx on public.assets(wedding_id);

create function app_private.owns_wedding(wid uuid) returns boolean language sql stable security definer
set search_path='' as $$ select exists(select 1 from public.weddings where id=wid and owner_id=auth.uid()) $$;
revoke all on function app_private.owns_wedding(uuid) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.owns_wedding(uuid) to authenticated;

alter table public.weddings enable row level security;
alter table public.invitation_groups enable row level security;
alter table public.guests enable row level security;
alter table public.wedding_tables enable row level security;
alter table public.assets enable row level security;
create policy wedding_select on public.weddings for select to authenticated using(owner_id=auth.uid());
create policy wedding_insert on public.weddings for insert to authenticated with check(owner_id=auth.uid() and not published and published_config is null and version=1);
create policy groups_owner on public.invitation_groups for all to authenticated using(app_private.owns_wedding(wedding_id)) with check(app_private.owns_wedding(wedding_id));
create policy guests_owner on public.guests for all to authenticated using(app_private.owns_wedding(wedding_id)) with check(app_private.owns_wedding(wedding_id));
create policy tables_owner on public.wedding_tables for all to authenticated using(app_private.owns_wedding(wedding_id)) with check(app_private.owns_wedding(wedding_id));
create policy assets_owner on public.assets for all to authenticated using(app_private.owns_wedding(wedding_id)) with check(app_private.owns_wedding(wedding_id));
revoke all on public.weddings,public.invitation_groups,public.guests,public.wedding_tables,public.assets from anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select,insert on public.weddings to authenticated;
grant select,delete on public.invitation_groups to authenticated;
grant select on public.guests to authenticated;
grant update(name,table_id) on public.guests to authenticated;
grant select,insert,delete on public.wedding_tables to authenticated;
grant select,insert on public.assets to authenticated;
grant update(alt) on public.assets to authenticated;

create function app_private.validate_config(cfg jsonb,wid uuid) returns void language plpgsql set search_path='' as $$
declare asset_id uuid; local_date date; event_time time; tz text; field text; entry jsonb;
begin
 if jsonb_typeof(cfg)<>'object' or cfg->'couple' is null or cfg->'rsvp' is null then raise exception 'Configuración incompleta'; end if;
 local_date := (cfg->'couple'->>'date')::date; event_time := (cfg->'couple'->>'time')::time; tz := cfg->'couple'->>'timezone';
 if local_date is null or event_time is null or not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then raise exception 'Fecha, hora o zona horaria inválida'; end if;
 if length(trim(cfg->'couple'->>'bride')) not between 1 and 120 or length(trim(cfg->'couple'->>'groom')) not between 1 and 120 then raise exception 'Nombres inválidos'; end if;
 if (cfg->'rsvp'->>'deadline')::date is null then raise exception 'Falta la fecha límite'; end if;
 if jsonb_typeof(cfg->'sections')<>'array' or jsonb_array_length(cfg->'sections')<>11 then raise exception 'Secciones inválidas'; end if;
 if jsonb_typeof(cfg->'gallery')<>'array' or jsonb_array_length(cfg->'gallery')>30 then raise exception 'Galería inválida'; end if;
 for asset_id in select value::uuid from jsonb_array_elements_text(cfg->'gallery') loop
  if not exists(select 1 from public.assets where id=asset_id and wedding_id=wid and kind='photo') then raise exception 'Foto no disponible en este proyecto'; end if;
 end loop;
 if (select count(distinct value->>'key') from jsonb_array_elements(cfg->'sections'))<>11 then raise exception 'Secciones duplicadas';end if;
 for entry in select value from jsonb_array_elements(cfg->'sections') loop
  if coalesce(entry->>'key','') not in ('hero','countdown','story','gallery','schedule','location','dresscode','lodging','gifts','rsvp','final') or jsonb_typeof(entry->'enabled') is distinct from 'boolean' then raise exception 'Sección inválida';end if;
 end loop;
 foreach field in array array['bg','text','accent','soft','button'] loop
  if coalesce(cfg->'colors'->>field,'') !~* '^#[0-9a-f]{6}$' then raise exception 'Color inválido';end if;
 end loop;
 foreach field in array array['title','subtitle','body','button'] loop
  if coalesce(cfg->'fonts'->>field,'') not in ('Georgia','Arial','Palatino','Times New Roman','Trebuchet MS') and not exists(select 1 from public.assets where wedding_id=wid and kind='font' and family=cfg->'fonts'->>field) then raise exception 'Fuente no disponible';end if;
 end loop;
 if coalesce(cfg->>'background','') not in ('ivory','paper','linen','sage','blush') or coalesce(cfg->>'backgroundMode','') not in ('cover','repeat') then raise exception 'Fondo inválido';end if;
 foreach field in array array['allowChanges','showTables'] loop
  if jsonb_typeof(cfg->'rsvp'->field) is distinct from 'boolean' then raise exception 'Regla de RSVP inválida';end if;
 end loop;
 foreach field in array array['storyTitle','story','dresscode','lodging','gifts','giftsUrl','mapUrl','final'] loop
  if jsonb_typeof(cfg->'content'->field) is distinct from 'string' or length(cfg->'content'->>field)>4000 then raise exception 'Contenido inválido';end if;
 end loop;
 foreach field in array array['giftsUrl','mapUrl'] loop
  if cfg->'content'->>field<>'' and cfg->'content'->>field !~* '^https://' then raise exception 'Usa un enlace HTTPS';end if;
 end loop;
 if jsonb_typeof(cfg->'schedule') is distinct from 'array' or jsonb_array_length(cfg->'schedule')>20 then raise exception 'Itinerario inválido';end if;
 for entry in select value from jsonb_array_elements(cfg->'schedule') loop
  if coalesce(entry->>'time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or length(trim(coalesce(entry->>'label',''))) not between 1 and 4000 then raise exception 'Actividad inválida';end if;
 end loop;
 if nullif(cfg->>'heroAssetId','') is not null and not exists(select 1 from public.assets where id=(cfg->>'heroAssetId')::uuid and wedding_id=wid and kind='photo') then raise exception 'Foto de portada no disponible'; end if;
 if nullif(cfg->>'backgroundAssetId','') is not null and not exists(select 1 from public.assets where id=(cfg->>'backgroundAssetId')::uuid and wedding_id=wid and kind='background') then raise exception 'Fondo no disponible'; end if;
end $$;
revoke all on function app_private.validate_config(jsonb,uuid) from public;
create function app_private.validate_new_wedding() returns trigger language plpgsql security definer set search_path='' as $$ begin perform app_private.validate_config(new.config,new.id);return new;end $$;
revoke all on function app_private.validate_new_wedding() from public;
create trigger validate_new_wedding before insert on public.weddings for each row execute function app_private.validate_new_wedding();

create function public.save_wedding(wid uuid,expected_version integer,new_config jsonb,make_public boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.weddings;
begin
 select * into w from public.weddings where id=wid and owner_id=auth.uid() for update;
 if not found then raise exception 'No tienes acceso a este proyecto'; end if;
 if w.version<>expected_version then raise exception 'Hay una versión más reciente. Recarga la página antes de editar para evitar sobrescribir cambios.'; end if;
 perform app_private.validate_config(new_config,wid);
 update public.weddings set config=new_config,published_config=case when make_public then new_config else published_config end,published=case when make_public then true else published end,version=version+1,updated_at=now() where id=wid returning * into w;
 return to_jsonb(w);
end $$;
create function public.unpublish_wedding(wid uuid,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.weddings;
begin
 select * into w from public.weddings where id=wid and owner_id=auth.uid() for update;
 if not found then raise exception 'No tienes acceso a este proyecto';end if;
 if w.version<>expected_version then raise exception 'Hay una versión más reciente. Recarga antes de continuar.';end if;
 update public.weddings set published=false,version=version+1,updated_at=now() where id=wid returning * into w;return to_jsonb(w);
end $$;
create function public.create_invitation_group(wid uuid,group_name text,seat_count integer) returns uuid language plpgsql security definer set search_path='' as $$
declare gid uuid; i integer;
begin
 if not app_private.owns_wedding(wid) then raise exception 'No tienes acceso a este proyecto';end if;
 insert into public.invitation_groups(wedding_id,display_name,seats) values(wid,trim(group_name),seat_count) returning id into gid;
 for i in 1..seat_count loop
  insert into public.guests(wedding_id,group_id,name) values(wid,gid,case when i=1 then trim(group_name) else 'Acompañante '||(i-1)::text end);
 end loop;return gid;
end $$;

-- Seat assignment serializes against the destination table row, preventing overbooking.
create function app_private.check_table_capacity() returns trigger language plpgsql security definer set search_path='' as $$
declare cap integer; occupants integer;
begin
 new.updated_at:=now();
 if new.status<>'attending' then new.table_id:=null;end if;
 if new.table_id is not null then
  select capacity into cap from public.wedding_tables where id=new.table_id and wedding_id=new.wedding_id for update;
  if not found then raise exception 'Mesa no disponible en este proyecto';end if;
  select count(*) into occupants from public.guests where table_id=new.table_id and id<>new.id;
  if occupants>=cap then raise exception 'Esta mesa ya está completa';end if;
 end if;
 return new;
end $$;
revoke all on function app_private.check_table_capacity() from public;
create trigger guests_capacity before insert or update on public.guests for each row execute function app_private.check_table_capacity();

create function app_private.published_assets(wid uuid,cfg jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at),'[]'::jsonb) from public.assets a where a.wedding_id=wid and (
  a.id::text in (select jsonb_array_elements_text(cfg->'gallery')) or a.id::text=cfg->>'heroAssetId' or a.id::text=cfg->>'backgroundAssetId'
  or (a.kind='font' and a.family in (select jsonb_each_text.value from jsonb_each_text(cfg->'fonts')))
 )
$$;
revoke all on function app_private.published_assets(uuid,jsonb) from public;
create function public.get_public_wedding(wedding_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('config',w.published_config,'assets',app_private.published_assets(w.id,w.published_config),'group',null,'guests','[]'::jsonb)
 from public.weddings w where w.slug=wedding_slug and w.published=true
$$;
create function public.get_invitation(invite_token uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('config',w.published_config,'assets',app_private.published_assets(w.id,w.published_config),
 'group',jsonb_build_object('display_name',ig.display_name,'seats',ig.seats),
 'guests',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'status',g.status,'dietary',g.dietary,'companion_name',g.companion_name,
 'table_name',case when coalesce((w.published_config->'rsvp'->>'showTables')::boolean,false) then (select t.name from public.wedding_tables t where t.id=g.table_id) else null end) order by g.created_at,g.id)
 from public.guests g where g.group_id=ig.id),'[]'::jsonb))
 from public.invitation_groups ig join public.weddings w on w.id=ig.wedding_id where ig.token=invite_token and w.published=true
$$;
create function public.submit_rsvp(invite_token uuid,answers jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare ig public.invitation_groups;cfg jsonb; answer jsonb; total integer;deadline date;
begin
 select * into ig from public.invitation_groups where token=invite_token for update;
 if not found then raise exception 'Invitación no disponible';end if;
 select published_config into cfg from public.weddings where id=ig.wedding_id and published=true;
 if cfg is null then raise exception 'Invitación no disponible';end if;
 deadline:=(cfg->'rsvp'->>'deadline')::date;
 if (now() at time zone (cfg->'couple'->>'timezone'))::date>deadline then raise exception 'La fecha para confirmar ha terminado. Escríbenos para hacer un cambio.';end if;
 if ig.last_rsvp_at>now()-interval '3 seconds' then raise exception 'Espera unos segundos antes de volver a guardar.';end if;
 if not coalesce((cfg->'rsvp'->>'allowChanges')::boolean,false) and exists(select 1 from public.guests where group_id=ig.id and status<>'pending') then raise exception 'Tu respuesta ya fue registrada. Escríbenos para hacer un cambio.';end if;
 if jsonb_typeof(answers)<>'array' then raise exception 'Respuesta inválida';end if;
 select count(*) into total from public.guests where group_id=ig.id;
 if jsonb_array_length(answers)<>total or total<>ig.seats then raise exception 'Confirma todos los pases de tu invitación';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(answers))<>total then raise exception 'Pases duplicados';end if;
 for answer in select value from jsonb_array_elements(answers) loop
  if coalesce(answer->>'status','') not in ('attending','declined') then raise exception 'Selecciona asistencia para cada pase';end if;
  if not exists(select 1 from public.guests where id=(answer->>'id')::uuid and group_id=ig.id) then raise exception 'Pase no disponible en esta invitación';end if;
  update public.guests set status=answer->>'status',dietary=case when answer->>'status'='attending' then trim(coalesce(answer->>'dietary','')) else '' end,companion_name=trim(coalesce(answer->>'companion_name','')) where id=(answer->>'id')::uuid and group_id=ig.id;
 end loop;
 update public.invitation_groups set last_rsvp_at=now() where id=ig.id;
 return true;
end $$;
revoke all on function public.save_wedding(uuid,integer,jsonb,boolean),public.unpublish_wedding(uuid,integer),public.create_invitation_group(uuid,text,integer),public.get_public_wedding(text),public.get_invitation(uuid),public.submit_rsvp(uuid,jsonb) from public;
grant execute on function public.save_wedding(uuid,integer,jsonb,boolean),public.unpublish_wedding(uuid,integer),public.create_invitation_group(uuid,text,integer) to authenticated;
grant execute on function public.get_public_wedding(text),public.get_invitation(uuid),public.submit_rsvp(uuid,jsonb) to anon,authenticated;

-- Public bucket: invitation photos/fonts are public assets, not private guest records.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('wedding-assets','wedding-assets',true,10485760,array['image/jpeg','image/png','image/webp','font/woff','font/woff2','font/ttf','font/otf']);
create policy asset_upload on storage.objects for insert to authenticated with check(bucket_id='wedding-assets' and app_private.owns_wedding(((storage.foldername(name))[1])::uuid));
create policy asset_read_owner on storage.objects for select to authenticated using(bucket_id='wedding-assets' and app_private.owns_wedding(((storage.foldername(name))[1])::uuid));
create policy asset_cleanup on storage.objects for delete to authenticated using(bucket_id='wedding-assets' and app_private.owns_wedding(((storage.foldername(name))[1])::uuid) and not exists(select 1 from public.assets a where a.path=storage.objects.name));
