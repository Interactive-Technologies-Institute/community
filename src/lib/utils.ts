/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	type ActionFailure,
	type LoadEvent,
	type RequestEvent,
	type ServerLoadEvent,
} from '@sveltejs/kit';
import { clsx, type ClassValue } from 'clsx';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { setFlash } from 'sveltekit-flash-message/server';
import type { EncodeAndDecodeOptions } from 'sveltekit-search-params/sveltekit-search-params';
import { fail, superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { twMerge } from 'tailwind-merge';
import type { ZodTypeAny } from 'zod';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t,
			});
		},
		easing: cubicOut,
	};
};

export function handleSignInRedirect(event: LoadEvent | ServerLoadEvent) {
	const redirectTo = event.url.pathname + event.url.search;
	return `/sign-in?redirectTo=${redirectTo}`;
}

type MaybePromise<T> = T | Promise<T>;

export type FormAction<
	Schema extends ZodTypeAny,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null,
	RequireAuth extends boolean = true,
> = (
	event: RequestEvent<Params, RouteId>,
	userId: RequireAuth extends true ? string : undefined,
	form: SuperValidated<Infer<Schema>>
) => MaybePromise<OutputData>;

interface HandleFormActionOptions<RequireAuth extends boolean> {
	requireAuth?: RequireAuth;
}

function assertUserId<RequireAuth extends boolean>(
	userId: string | null | undefined,
	requireAuth: RequireAuth
): asserts userId is RequireAuth extends true ? string : undefined {
	if (requireAuth && typeof userId !== 'string') {
		throw new Error('User ID must be a string when authentication is required.');
	}
}

export async function handleFormAction<
	Schema extends ZodTypeAny,
	Params extends Partial<Record<string, string>>,
	OutputData extends Record<string, any> | void,
	RouteId extends string | null,
	RequireAuth extends boolean = true,
>(
	event: RequestEvent<Params, RouteId>,
	schema: Schema,
	formId: string,
	action: FormAction<Schema, Params, OutputData, RouteId, RequireAuth>,
	options?: HandleFormActionOptions<RequireAuth>
): Promise<OutputData | ActionFailure<{ message: string }>> {
	const { requireAuth = true as RequireAuth } = options ?? {};
	let userId: string | undefined = undefined;

	const form = await superValidate(event.request, zod(schema), { id: formId });

	if (requireAuth) {
		const { session, user } = await event.locals.safeGetSession();

		if (!session || !user) {
			setFlash({ type: 'error', message: 'Unauthorized' }, event.cookies);
			return fail(401, { message: 'Unauthorized', form });
		}

		userId = user.id;
	}

	assertUserId(userId, requireAuth);

	if (!form.valid) {
		const errorMessage = 'Invalid form.';
		setFlash({ type: 'error', message: errorMessage }, event.cookies);
		return fail(400, { message: errorMessage, form });
	}

	const result = await action(event, userId, form);

	return result;
}

export function stringQueryParam(defaultValue?: string): EncodeAndDecodeOptions<string> {
	return {
		encode: (value) => (value === '' ? undefined : (value ?? undefined)),
		decode: (value) => value ?? null,
		defaultValue,
	};
}

export function numberQueryParam(defaultValue?: number): EncodeAndDecodeOptions<number> {
	return {
		encode: (value) => {
			if (value === undefined || value === null) return undefined;
			return value.toString();
		},
		decode: (value) => {
			if (value === null || value === undefined) return null;
			const parsed = Number(value);
			return isNaN(parsed) ? null : parsed;
		},
		defaultValue,
	};
}

export function arrayQueryParam(defaultValue?: string[]): EncodeAndDecodeOptions<string[]> {
	return {
		encode: (value) => {
			if (!value || value.length === 0) return undefined;
			return value.join(',');
		},
		decode: (value) => {
			if (!value) return null;
			return value.split(',');
		},
		defaultValue,
	};
}

export function firstAndLastInitials(name: string) {
	if (name.length === 0) return '';
	const names = name.split(' ');
	if (names.length === 1) return names[0][0].toUpperCase();
	return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}
