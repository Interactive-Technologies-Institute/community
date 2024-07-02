/* MAP */
create table public.map_pins (
	id uuid primary key references public.profiles on delete cascade not null,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
	lng double precision not null,
	lat double precision not null
);
create trigger handle_updated_at before
update on public.map_pins for each row execute procedure moddatetime (updated_at);
create table public.map_pins_moderation(
	id bigint generated by default as identity primary key,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
	user_id uuid references public.profiles not null,
	map_pin_id uuid references public.map_pins not null,
	status public.moderation_status not null,
	comment text not null
);
create trigger handle_updated_at before
update on public.map_pins_moderation for each row execute procedure moddatetime (updated_at);
create function public.handle_map_pin_moderation_insert() returns trigger language plpgsql security definer as $$ begin
insert into public.map_pins_moderation (map_pin_id, user_id, status, comment)
values (
		new.id,
		new.id,
		'pending'::moderation_status,
		'Pending moderation'
	);
return new;
end;
$$;
create trigger on_map_pins_insert
after
insert on public.map_pins for each row execute procedure public.handle_map_pin_moderation_insert();
create function handle_map_pin_moderation_update() returns trigger language plpgsql security definer as $$ begin
update public.map_pins_moderation
set status = 'pending'::moderation_status,
	comment = 'Pending moderation'
where map_pin_id = new.id;
return new;
end;
$$;
create trigger on_map_pins_update
after
update on public.map_pins for each row execute procedure handle_map_pin_moderation_update();
create view public.map_pins_view with (security_invoker = on) as
select mp.*,
	m.status as moderation_status
from public.map_pins mp
	join public.map_pins_moderation m on mp.id = m.map_pin_id;
-- RLS policies
alter table public.map_pins enable row level security;
alter table public.map_pins_moderation enable row level security;
create policy "Allow users to read approved map pins" on public.map_pins for
select using (
		exists (
			select 1
			from public.map_pins_moderation
			where map_pin_id = map_pins.id
				and status = 'approved'::moderation_status
		)
	);
create policy "Allow users to read their own map pins" on public.map_pins for
select using (auth.uid() = id);
create policy "Allow users to create their own map pins" on public.map_pins for
insert with check (
		(
			select authorize('map.create')
		)
		and auth.uid() = id
	);
create policy "Allow users to update their own map pins" on public.map_pins for
update using (
		(
			select authorize('map.update')
		)
		and auth.uid() = id
	);
create policy "Allow users to delete their own map pins" on public.map_pins for delete using (
	(
		select authorize('map.delete')
	)
	and auth.uid() = id
);
create policy "Allow moderators read all map pins" on public.map_pins for
select using (
		(
			select authorize('map.moderate')
		)
	);
create policy "Allow moderators update all map pins" on public.map_pins for
update using (
		(
			select authorize('map.moderate')
		)
	);
create policy "Allow moderators delete all map pins" on public.map_pins for delete using (
	(
		select authorize('map.moderate')
	)
);
create policy "Allow users to read approved map pins moderation" on public.map_pins_moderation for
select using (
		status = 'approved'::public.moderation_status
	);
create policy "Allow users to read their own map pins moderation" on public.map_pins_moderation for
select using (auth.uid() = user_id);
create policy "Allow moderators to read all map pins moderation" on public.map_pins_moderation for
select using (
		(
			select authorize('map.moderate')
		)
	);
create policy "Allow moderators to update all map pins moderation" on public.map_pins_moderation for
update using (
		(
			select authorize('map.moderate')
		)
	);