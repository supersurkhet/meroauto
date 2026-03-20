import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// user is already provided by the root layout server load
	return {};
};
