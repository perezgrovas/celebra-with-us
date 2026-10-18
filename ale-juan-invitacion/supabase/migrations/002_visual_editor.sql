-- Run AFTER 001_initial.sql, once, in the SAME Supabase project.
-- Additive and repeatable: existing configurations, guests, tokens and replies remain.
begin;
create table if not exists app_private.builtin_fonts(family text primary key);
revoke all on app_private.builtin_fonts from public,anon,authenticated;
insert into app_private.builtin_fonts(family) values
('Library_great_vibes'),
('Library_allura'),
('Library_alex_brush'),
('Library_parisienne'),
('Library_pinyon_script'),
('Library_italianno'),
('Library_tangerine'),
('Library_ruthie'),
('Library_qwigley'),
('Library_rouge_script'),
('Library_herr_von_muellerhoff'),
('Library_mrs_saint_delafield'),
('Library_dancing_script'),
('Library_caveat'),
('Library_pacifico'),
('Library_sacramento'),
('Library_kalam'),
('Library_handlee'),
('Library_satisfy'),
('Library_bad_script'),
('Library_marck_script'),
('Library_patrick_hand'),
('Library_sue_ellen_francisco'),
('Library_architects_daughter'),
('Library_playfair_display'),
('Library_cormorant_garamond'),
('Library_libre_baskerville'),
('Library_lora'),
('Library_cormorant'),
('Library_cinzel'),
('Library_eb_garamond'),
('Library_bodoni_moda'),
('Library_prata'),
('Library_cardo'),
('Library_merriweather'),
('Library_dm_serif_display'),
('Library_montserrat'),
('Library_lato'),
('Library_poppins'),
('Library_raleway'),
('Library_open_sans'),
('Library_nunito'),
('Library_josefin_sans'),
('Library_quicksand'),
('Library_work_sans'),
('Library_jost'),
('Library_mulish'),
('Library_roboto') on conflict do nothing;
-- Retain the v1 contract validator for the unchanged event and RSVP fields.
do $$ begin
 if to_regprocedure('app_private.validate_config_v1(jsonb,uuid)') is null then
  alter function app_private.validate_config(jsonb,uuid) rename to validate_config_v1;
 end if;
end $$;
create or replace function app_private.validate_config(cfg jsonb,wid uuid) returns void language plpgsql set search_path='' as $$
declare base jsonb:=cfg;field text;sec record;entry jsonb;pos jsonb;aid uuid;d jsonb:=cfg->'design';chosen_font text;
begin
 if jsonb_typeof(cfg->'sections') is distinct from 'array' or jsonb_array_length(cfg->'sections') not between 11 and 12 then raise exception 'Secciones inválidas';end if;
 if (select count(*) from jsonb_array_elements(cfg->'sections') v where v->>'key'='video')>1 then raise exception 'Video duplicado';end if;
 if exists(select 1 from jsonb_array_elements(cfg->'sections') v where v->>'key'='video' and jsonb_typeof(v->'enabled') is distinct from 'boolean') then raise exception 'Video inválido';end if;
 base:=jsonb_set(base,'{sections}',(select jsonb_agg(value) from jsonb_array_elements(cfg->'sections') where value->>'key'<>'video'));
 foreach field in array array['title','subtitle','body','button'] loop
  if exists(select 1 from app_private.builtin_fonts where family=cfg->'fonts'->>field) then base:=jsonb_set(base,array['fonts',field],'"Georgia"'::jsonb);end if;
 end loop;
 perform app_private.validate_config_v1(base,wid);
 if d is null then return;end if;
 if jsonb_typeof(d) is distinct from 'object' then raise exception 'Diseño inválido';end if;
 if jsonb_typeof(d->'sections') is distinct from 'object' then raise exception 'Diseño de secciones inválido';end if;
 for sec in select * from jsonb_each(d->'sections') loop
  if sec.key not in ('hero','countdown','story','gallery','schedule','location','dresscode','lodging','gifts','rsvp','final','video') then raise exception 'Sección desconocida';end if;
  entry:=sec.value;
  if entry->>'layout' not in ('center','split-left','split-right','editorial','photo-background','card') then raise exception 'Acomodo inválido';end if;
  if nullif(entry->>'imageAssetId','') is not null and not exists(select 1 from public.assets where id=(entry->>'imageAssetId')::uuid and wedding_id=wid and kind in ('photo','sticker')) then raise exception 'Foto no disponible';end if;
  if (entry->>'padding')::numeric not between 24 and 180 or (entry->>'titleSize')::numeric not between 24 and 100 or (entry->>'bodySize')::numeric not between 12 and 28 then raise exception 'Tamaño de sección inválido';end if;
 end loop;
 if jsonb_typeof(d->'layers') is distinct from 'array' or jsonb_array_length(d->'layers')>100 then raise exception 'Demasiados elementos';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(d->'layers'))<>jsonb_array_length(d->'layers') then raise exception 'Elementos duplicados';end if;
 for entry in select value from jsonb_array_elements(d->'layers') loop
  if entry->>'kind' not in ('text','doodle','photo') or coalesce(entry->>'section','') not in ('hero','countdown','story','gallery','schedule','location','dresscode','lodging','gifts','rsvp','final','video') then raise exception 'Elemento inválido';end if;
  if length(coalesce(entry->>'text',''))>1000 then raise exception 'Texto demasiado largo';end if;
  if entry->>'color' !~* '^#[0-9a-f]{6}$' or (entry->>'rotation')::numeric not between -180 and 180 or (entry->>'size')::numeric not between 12 and 120 or (entry->>'opacity')::numeric not between 0.1 and 1 then raise exception 'Estilo inválido';end if;
  if entry->>'kind'='photo' and not exists(select 1 from public.assets where id=(entry->>'assetId')::uuid and wedding_id=wid and kind in ('photo','sticker')) then raise exception 'Imagen de elemento no disponible';end if;
  chosen_font:=entry->>'font';
  if chosen_font not in ('Georgia','Arial','Palatino','Times New Roman','Trebuchet MS') and not exists(select 1 from app_private.builtin_fonts where family=chosen_font) and not exists(select 1 from public.assets where wedding_id=wid and kind='font' and family=chosen_font) then raise exception 'Letra no disponible';end if;
  foreach field in array array['position','mobile'] loop
   pos:=entry->field;if pos is null then if field='position' then raise exception 'Falta la posición';else continue;end if;end if;
   if jsonb_typeof(pos->'x') is distinct from 'number' or jsonb_typeof(pos->'y') is distinct from 'number' or jsonb_typeof(pos->'width') is distinct from 'number' or (pos->>'x')::numeric not between 0 and 100 or (pos->>'y')::numeric not between 0 and 100 or (pos->>'width')::numeric not between 5 and 100 then raise exception 'Posición inválida';end if;
  end loop;
 end loop;
 if d->>'galleryMode' not in ('carousel','grid','mosaic') or d->>'galleryFit' not in ('contain','cover') then raise exception 'Galería inválida';end if;
 foreach field in array array['assetId','posterAssetId'] loop
  aid:=nullif(d->'video'->>field,'')::uuid;
  if aid is not null and not exists(select 1 from public.assets where id=aid and wedding_id=wid and ((field='assetId' and kind='video') or (field='posterAssetId' and kind='photo'))) then raise exception 'Video o portada no disponible';end if;
 end loop;
 if coalesce(d->'video'->>'url','')<>'' and d->'video'->>'url' !~* '^https://' then raise exception 'Usa un enlace HTTPS';end if;
end $$;
revoke all on function app_private.validate_config(jsonb,uuid) from public,anon,authenticated;

alter table public.assets drop constraint if exists assets_kind_check;
alter table public.assets add constraint assets_kind_check check(kind in ('photo','background','font','sticker','video'));
update storage.buckets set file_size_limit=52428800,allowed_mime_types=array['image/jpeg','image/png','image/webp','font/woff','font/woff2','font/ttf','font/otf','video/mp4','video/webm'] where id='wedding-assets';

create or replace function app_private.published_assets(wid uuid,cfg jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 with refs as (
  select value as id from jsonb_array_elements_text(cfg->'gallery')
  union select cfg->>'heroAssetId' union select cfg->>'backgroundAssetId'
  union select value->>'imageAssetId' from jsonb_each(coalesce(cfg->'design'->'sections','{}'::jsonb))
  union select value->>'assetId' from jsonb_array_elements(coalesce(cfg->'design'->'layers','[]'::jsonb))
  union select cfg->'design'->'video'->>'assetId' union select cfg->'design'->'video'->>'posterAssetId'
 )
 select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at),'[]'::jsonb) from public.assets a where a.wedding_id=wid and (
  a.id::text in (select id from refs)
  or (a.kind='font' and (a.family in (select value from jsonb_each_text(cfg->'fonts')) or a.family in (select value->>'font' from jsonb_array_elements(coalesce(cfg->'design'->'layers','[]'::jsonb)))))
 )
$$;
revoke all on function app_private.published_assets(uuid,jsonb) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
