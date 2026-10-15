import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/App";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs | TALENT HUNT 2K26" },
      { name: "description", content: "Answers to common questions about TALENT HUNT 2K26: eligibility, teams, registration and venue." },
      { property: "og:title", content: "FAQs | TALENT HUNT 2K26" },
      { property: "og:description", content: "Common questions about TALENT HUNT 2K26." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <App view="faqs" />,
});
