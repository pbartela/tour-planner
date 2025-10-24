export const SkeletonLoader = () => {
  return (
    <div className="flex animate-pulse flex-col gap-y-4 rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
      <div className="h-6 w-3/4 rounded-md bg-base-200" />
      <div className="h-4 w-1/2 rounded-md bg-base-200" />
    </div>
  );
};
