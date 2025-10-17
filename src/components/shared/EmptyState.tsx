import { Button } from "@/components/ui/button";

export const EmptyState = () => {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
			<div className="flex flex-col items-center gap-y-4">
				<h3 className="text-2xl font-bold tracking-tight">You have no active tours</h3>
				<p className="text-sm text-muted-foreground">Get started by creating a new one.</p>
				<a href="/tours/create">
					<Button>Create a Tour</Button>
				</a>
			</div>
		</div>
	);
};
