import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const initial: Theme = browser
		? (localStorage.getItem('theme') as Theme) ??
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		: 'light';

	const { subscribe, set, update } = writable<Theme>(initial);

	return {
		subscribe,
		toggle: () =>
			update((current) => {
				const next = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', next);
					document.documentElement.classList.toggle('dark', next === 'dark');
				}
				return next;
			}),
		set: (value: Theme) => {
			if (browser) {
				localStorage.setItem('theme', value);
				document.documentElement.classList.toggle('dark', value === 'dark');
			}
			set(value);
		}
	};
}

export const theme = createThemeStore();
