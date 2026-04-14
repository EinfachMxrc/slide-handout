export function Skeleton({
  className = "",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`animate-pulse rounded-card bg-navy-100 dark:bg-navy-800 ${className}`}
    />
  );
}
