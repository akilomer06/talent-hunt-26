import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/App";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { event?: string } => (typeof s['event'] === "string" && s['event'] ? { event: s['event'] as string } : {}),
  head: () => ({
    meta: [
      { title: "Register | TALENT HUNT 2K26" },
      { name: "description", content: "Registration details and guidelines for TALENT HUNT 2K26, Department of CSE, Crescent Institute." },
      { property: "og:title", content: "Register | TALENT HUNT 2K26" },
      { property: "og:description", content: "How to register for TALENT HUNT 2K26 events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterRoute,
});

function RegisterRoute() {
  const { event } = Route.useSearch();
  return <App view="register" eventId={event || "trashion"} />;
}
