
"use client";

import usePresence from "@/hooks/use-presence";

/**
 * A client-side component responsible for initializing the presence hook.
 * It renders nothing to the DOM.
 */
export default function PresenceManager() {
  usePresence();
  return null;
}
