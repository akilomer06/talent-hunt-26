import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TALENT HUNT 2K26 | Department of CSE, Crescent Institute" },
      {
        name: "description",
        content:
          "Official website for TALENT HUNT 2K26, organised by the Department of CSE, B.S. Abdur Rahman Crescent Institute of Science and Technology, Chennai. 26 October 2026.",
      },
      { property: "og:title", content: "TALENT HUNT 2K26 | Department of CSE, Crescent Institute" },
      {
        property: "og:description",
        content: "TALENT HUNT 2K26 — events, venue and registration. 26 October 2026, Chennai. Only for CSE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});
