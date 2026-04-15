"use client";

import { ConvexReactClient } from "convex/react";
import { env } from "#/env";

let _client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (!_client) {
    _client = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
  }
  return _client;
}
