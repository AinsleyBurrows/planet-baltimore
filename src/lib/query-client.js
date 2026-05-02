import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Cache data for 3 minutes before considering it stale —
			// prevents redundant refetches when navigating between pages
			staleTime: 3 * 60 * 1000,
			// Keep unused query data in memory for 5 minutes
			gcTime: 5 * 60 * 1000,
		},
	},
});