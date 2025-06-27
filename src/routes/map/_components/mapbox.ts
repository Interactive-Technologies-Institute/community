import mapboxgl from 'mapbox-gl';
import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';

mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;
const key = Symbol();

export type MBMapContext = {
	getMap: () => mapboxgl.Map | undefined;
};

export { key, mapboxgl };
