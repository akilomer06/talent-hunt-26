import { createFileRoute, notFound } from "@tanstack/react-router";
import { App } from "@/App";
import { EVENTS } from "@/data/eventsData";

export const Route = createFileRoute("/events/$eventId")({
  loader: ({ params }) => {
    const event = EVENTS.find((e) => e.id === params.eventId);
    if (!event) throw notFound();
    return { id: event.id, title: event.title, desc: event.shortDesc };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} | TALENT HUNT 2K26` : "Event | TALENT HUNT 2K26";
    const desc = loaderData?.desc ?? "Event details for TALENT HUNT 2K26.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EventRoute,
});

function EventRoute() {
  const { id } = Route.useLoaderData();
  return <App view="event-detail" eventId={id} />;
}
