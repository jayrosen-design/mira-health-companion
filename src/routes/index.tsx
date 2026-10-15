import { createFileRoute } from "@tanstack/react-router";
import { MiraChat } from "@/components/mira/MiraChat";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Chat with Mira · Parent Vaccine Talk" },
      { name: "description", content: "Talk through questions about the HPV vaccine with Mira, an AI assistant from Parent Vaccine Talk. University research prototype." },
      { property: "og:title", content: "Chat with Mira · Parent Vaccine Talk" },
      { property: "og:description", content: "Talk through questions about the HPV vaccine with Mira, an AI assistant from Parent Vaccine Talk. University research prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Chat with Mira · Parent Vaccine Talk" },
      { name: "twitter:description", content: "Talk through questions about the HPV vaccine with Mira, an AI assistant from Parent Vaccine Talk. University research prototype." },
      { property: "og:url", content: "https://chat.parentvaccinetalk.org" },
    ],
    links: [{ rel: "canonical", href: "https://chat.parentvaccinetalk.org" }],
  }),
});

function Index() {
  return <MiraChat />;
}
