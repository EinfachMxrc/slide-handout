import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-teal-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Diese Seite existiert nicht.
      </h1>
      <p className="mt-3 text-navy-700 dark:text-navy-100">
        Möglicherweise ein veralteter Handout-Link.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-pill border border-navy-100 px-4 py-2 text-sm font-medium hover:border-teal-400 dark:border-navy-700"
      >
        Zur Startseite
      </Link>
    </main>
  );
}
