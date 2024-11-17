/* ADMIN */
-- Features
create type public.feature as enum ('guides', 'events', 'map', 'docs');
create table public.feature_flags (
	id public.feature primary key,
	enabled boolean not null default false
);
-- Branding
create table public.branding (
	id bigint generated by default as identity primary key,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
	name text not null,
	slogan text not null,
	logo text,
	color_theme text not null,
	radius double precision not null
);
create trigger handle_updated_at before
update on public.branding for each row execute procedure moddatetime (updated_at);
-- User types
create table public.user_types (
	slug text primary key,
	label text not null,
	is_default boolean not null default false
);
create unique index on public.user_types (is_default)
where is_default;
create type public.user_type as (slug text, label text, is_default boolean);
create function public.update_user_types(types user_type []) returns void language plpgsql as $$
declare type user_type;
begin
delete from public.user_types
where true;
foreach type in array types loop
insert into public.user_types (slug, label, is_default)
values (type.slug, type.label, type.is_default);
end loop;
end;
$$;
-- Storage Buckets
-- insert into storage.buckets (id, name, public, allowed_mime_types)
-- values ('branding', 'Branding', true, '{"image/*"}');
-- RLS policies
alter table public.feature_flags enable row level security;
alter table public.user_types enable row level security;
alter table public.branding enable row level security;
create policy "Allow all users to read features" on public.feature_flags for
select using (true);
create policy "Allow all users to read branding" on public.branding for
select using (true);
create policy "Allow all users to read user types" on public.user_types for
select using (true);
create policy "Allow admins to insert features" on public.feature_flags for
insert with check (
		(
			select authorize('features.update')
		)
	);
create policy "Allow admins to update features" on public.feature_flags for
update using (
		(
			select authorize('features.update')
		)
	);
create policy "Allow admins to insert branding" on public.branding for
insert with check (
		(
			select authorize('branding.update')
		)
	);
create policy "Allow admins to update branding" on public.branding for
update using (
		(
			select authorize('branding.update')
		)
	);
create policy "Allow admins to create user types" on public.user_types for
insert with check (
		(
			select authorize('user_types.update')
		)
	);
create policy "Allow admins to delete user types" on public.user_types for delete using (
	(
		select authorize('user_types.update')
	)
);
create policy "Allow users to manage branding files" on storage.objects for all using (
	bucket_id = 'branding'
	AND (
		select authorize('branding.update')
	)
) with check (
	bucket_id = 'branding'
	AND (
		select authorize('branding.update')
	)
);
-- Seed data
insert into public.feature_flags (id, enabled)
values ('guides'::public.feature, true),
	('events'::public.feature, true),
	('map'::public.feature, true),
	('docs'::public.feature, true);
insert into public.user_types (slug, label, is_default)
values ('default', 'Default', true);
insert into public.branding (name, slogan, color_theme, radius)
values (
		'Community',
		'A community for everyone',
		'neutral',
		0.5
	);