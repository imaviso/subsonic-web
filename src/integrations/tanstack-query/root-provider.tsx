import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Data stays fresh for 5 minutes - won't refetch during this time
				staleTime: 5 * 60 * 1000,
				// Keep unused data in cache for 30 minutes
				gcTime: 30 * 60 * 1000,
				// Don't refetch on window focus (user can manually refresh if needed)
				refetchOnWindowFocus: false,
				// Don't refetch when component remounts if data is still fresh
				refetchOnMount: false,
				// Retry failed requests once
				retry: 1,
			},
		},
	});
	return {
		queryClient,
	};
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
