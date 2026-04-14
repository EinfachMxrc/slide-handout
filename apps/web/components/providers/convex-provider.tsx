"use client";

import { ConvexProvider } from "convex/react";
import { useMemo } from "react";
import { getConvexClient } from "#/lib/convex/client";

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const client = useMemo(() => getConvexClient(), []);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
