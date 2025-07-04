/* STORIES */
create type public.story_role as enum ('community', 'technician');
create table public.story (
	id bigint generated by default as identity primary key,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
	storyteller text not null,
	user_id uuid references public.profiles not null,
	tags text [] not null,
	role public.story_role not null,
	recording_link text not null,
	transcription text,
	image text [] not null,
	template text,
	pub_story_text text [],
	pub_quotes text [],
	pub_selected_images text [],
	insights_gpt text
);
alter table public.story
add column fts tsvector generated always as (to_tsvector('simple', storyteller || ' ')) stored;
create index story_fts on public.story using gin (fts);
create trigger handle_updated_at before
update on public.story for each row execute procedure moddatetime (updated_at);
create table public.story_moderation(
	id bigint generated by default as identity primary key,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
	story_id bigint references public.story on delete cascade not null,
	user_id uuid references public.profiles not null,
	status public.moderation_status not null,
	comment text not null
);
create trigger handle_updated_at before
update on public.story_moderation for each row execute procedure moddatetime (updated_at);
create function public.handle_story_moderation_insert() returns trigger language plpgsql security definer as $$ begin
insert into public.story_moderation (story_id, user_id, status, comment)
values (
		new.id,
		new.user_id,
		'pending'::moderation_status,
		'Pending moderation'
	);
return new;
end;
$$;
create trigger on_story_insert
after
insert on public.story for each row execute procedure public.handle_story_moderation_insert();
create function handle_story_moderation_update() returns trigger language plpgsql security definer as $$ begin
update public.story_moderation
set status = 'pending'::moderation_status,
	comment = 'Pending moderation'
where story_id = new.id;
return new;
end;
$$;
create view public.story_view with (security_invoker = on) as
select h.*,
	m.status as moderation_status
from public.story h
	join public.story_moderation m on h.id = m.story_id;
create view public.story_tags with (security_invoker = on) as
select unnest(tags) as tag,
	count(*) as count
from public.story
group by tag;
-- Storage Buckets
-- insert into storage.buckets (id, name, public, allowed_mime_types)
-- values ('story', 'Stories', true, '{"image/*"}');
-- RLS policies
alter table public.story enable row level security;
alter table public.story_moderation enable row level security;
create policy "Allow users to read approved stories" on public.story for
select using (
		exists (
			select 1
			from public.story_moderation
			where story_id = story.id
				and status = 'approved'::public.moderation_status
		)
	);
create policy "Allow moderators to create their own stories" on public.story for
insert with check (
		(
			select authorize('story.create')
		)
		and auth.uid() = user_id
	);
create policy "Allow moderators read all stories" on public.story for
select using (
		(
			select authorize('story.moderate')
		)
	);
create policy "Allow moderators update all stories" on public.story for
update using (
		(
			select authorize('story.moderate')
		)
	);
create policy "Allow moderators delete all stories" on public.story for delete using (
	(
		select authorize('story.moderate')
	)
);
create policy "Allow users to delete their own stories" on public.story for delete using (
	(
		select authorize('story.delete')
	)
	and auth.uid() = user_id
);
create policy "Allow users to read approved stories moderation" on public.story_moderation for
select using (
		status = 'approved'::public.moderation_status
	);
create policy "Allow moderators to read all stories moderation" on public.story_moderation for
select using (
		(
			select authorize('story.moderate')
		)
	);
create policy "Allow moderators to update all stories moderation" on public.story_moderation for
update using (
		(
			select authorize('story.moderate')
		)
	);
-- create policy "Allow users to upload images for their stories" on storage.objects for
-- insert to authenticated with check (bucket_id = 'story'); */