export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`rounded-card border border-navy-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-900 ${className}`}
    >
      {children}
    </div>
  );
}
