/* NOTIFICATIONS */
create type public.notification_type as enum (
	'guide_pending',
	'guide_changes_requested',
	'guide_approved',
	'guide_rejected',
	'event_pending',
	'event_changes_requested',
	'event_approved',
	'event_rejected',
	'map_pin_pending',
	'map_pin_changes_requested',
	'map_pin_approved',
	'map_pin_rejected'
);
create table public.notifications (
	id bigint generated by default as identity primary key,
	inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
	user_id uuid references public.profiles not null,
	type public.notification_type not null,
	data jsonb default '{}'::jsonb not null,
	read boolean not null default false
);
create or replace function public.handle_guides_moderation_notification() returns trigger as $$
declare notification_type notification_type;
begin if new.status = 'pending' then notification_type := 'guide_pending';
elsif new.status = 'changes_requested' then notification_type := 'guide_changes_requested';
elsif new.status = 'approved' then notification_type := 'guide_approved';
elsif new.status = 'rejected' then notification_type := 'guide_rejected';
end if;
insert into public.notifications (user_id, type, data)
values (
		new.user_id,
		notification_type,
		jsonb_build_object('guide_id', new.guide_id)
	);
return new;
end;
$$ language plpgsql security definer;
create trigger guide_notification_trigger
after
insert on public.guides_moderation for each row execute function public.handle_guides_moderation_notification();
create or replace function public.handle_events_moderation_notification() returns trigger as $$
declare notification_type notification_type;
begin if new.status = 'pending' then notification_type := 'event_pending';
elsif new.status = 'changes_requested' then notification_type := 'event_changes_requested';
elsif new.status = 'approved' then notification_type := 'event_approved';
elsif new.status = 'rejected' then notification_type := 'event_rejected';
end if;
insert into public.notifications (user_id, type, data)
values (
		new.user_id,
		notification_type,
		jsonb_build_object('event_id', new.event_id)
	);
return new;
end;
$$ language plpgsql security definer;
create trigger event_notification_trigger
after
insert on public.events_moderation for each row execute function public.handle_events_moderation_notification();
create or replace function public.handle_map_pins_moderation_notification() returns trigger as $$
declare notification_type notification_type;
begin if new.status = 'pending' then notification_type := 'map_pin_pending';
elsif new.status = 'changes_requested' then notification_type := 'map_pin_changes_requested';
elsif new.status = 'approved' then notification_type := 'map_pin_approved';
elsif new.status = 'rejected' then notification_type := 'map_pin_rejected';
end if;
insert into public.notifications (user_id, type, data)
values (
		new.user_id,
		notification_type,
		jsonb_build_object('map_pin_id', new.map_pin_id)
	);
return new;
end;
$$ language plpgsql security definer;
create trigger map_pin_notification_trigger
after
insert on public.map_pins_moderation for each row execute function public.handle_map_pins_moderation_notification();
-- RLS policies
create policy "Allow users to read their own notifications" on public.notifications for
select using (user_id = auth.uid());