export const SkeletonLoader = () => {
	return (
		<div
			className="flex animate-pulse flex-col gap-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
		>
			<div className="h-6 w-3/4 rounded-md bg-gray-200 dark:bg-gray-800" />
			<div className="h-4 w-1/2 rounded-md bg-gray-200 dark:bg-gray-800" />
		</div>
	);
};
