import type { MergeDeep } from 'type-fest';
import type { Database as DatabaseGenerated } from './supabase-types.gen.ts';

type Step = { title: string; description: string; image: string };

export type Database = MergeDeep<
	DatabaseGenerated,
	{
		public: {
			Enums: {
				story_role: 'community' | 'technician';
			};
			Tables: {
				guides: {
					Row: {
						steps: Step[];
					};
					Insert: {
						steps: Step[];
					};
					Update: {
						steps?: Step[];
					};
				};
				notifications: {
					Row: {
						data: Record<string, string>;
					};
					Insert: {
						data?: Record<string, string>;
					};
					Update: {
						data?: Record<string, string>;
					};
				};
			};
			Views: {
				events_view: {
					Row: {
						date: string;
						description: string;
						fts: unknown;
						id: number;
						image: string;
						inserted_at: string;
						location: string;
						moderation_status: Database['public']['Enums']['moderation_status'];
						tags: string[];
						title: string;
						updated_at: string;
						user_id: string;
					};
				};
				events_tags: {
					Row: {
						count: number;
						tag: string;
					};
				};
				guides_view: {
					Row: {
						description: string;
						difficulty: Database['public']['Enums']['guide_difficulty'];
						duration: Database['public']['Enums']['guide_duration'];
						fts: unknown;
						id: number;
						image: string;
						inserted_at: string;
						moderation_status: Database['public']['Enums']['moderation_status'];
						steps: Step[];
						tags: string[];
						title: string;
						updated_at: string;
						user_id: string;
					};
				};
				guides_tags: {
					Row: {
						count: number;
						tag: string;
					};
				};
				latest_events_moderation: {
					Row: {
						comment: string;
						event_id: number;
						id: number;
						inserted_at: string;
						status: Database['public']['Enums']['moderation_status'];
						user_id: string;
					};
				};
				latest_guides_moderation: {
					Row: {
						comment: string;
						guide_id: number;
						id: number;
						inserted_at: string;
						status: Database['public']['Enums']['moderation_status'];
						user_id: string;
					};
				};
				latest_map_pins_moderation: {
					Row: {
						comment: string;
						id: number;
						inserted_at: string;
						map_pin_id: number;
						status: Database['public']['Enums']['moderation_status'];
						user_id: string;
					};
				};
				map_pins_view: {
					Row: {
						id: number;
						inserted_at: string;
						lat: number;
						lng: number;
						moderation_status: Database['public']['Enums']['moderation_status'];
						updated_at: string;
						user_id: string;
					};
				};
				story_view: {
					Row: {
						id: number;
						inserted_at: string;
						updated_at: string;
						storyteller: string;
						user_id: string;
						tags:string[];
						role: Database['public']['Enums']['story_role'];
						recording_link: string;
						transcription: string;
						image: string[];
						template: string;
						pub_story_text: string[];
						pub_quotes: string[];
						pub_selected_images: string[];
						pub_insights_gpt: string[];
						moderation_status: Database['public']['Enums']['moderation_status'];
					};
				};
				profiles_view: {
					Row: {
						description: string;
						display_name: string;
						email: string;
						id: string;
						inserted_at: string;
						role: Database['public']['Enums']['user_role'];
						type: string;
						updated_at: string;
						avatar: string | null;
					};
				};
			};
			Functions: {
				get_guides_ordered_by_useful: {
					Args: {
						sort_order: string;
						tag_filters: string[] | null;
					};
					Returns: Database['public']['Views']['guides_view']['Row'][];
				};
			};
		};
	}
>;
