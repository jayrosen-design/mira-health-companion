import { createFileRoute } from "@tanstack/react-router";
import { MiraChat } from "@/components/mira/MiraChat";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "MiraChat – HPV Vaccine Conversation Prototype" },
      {
        name: "description",
        content:
          "A private, text-based motivational interviewing prototype to help parents of 9- to 12-year-olds think through HPV vaccination.",
      },
      { property: "og:title", content: "MiraChat – HPV Vaccine Conversation Prototype" },
      {
        property: "og:description",
        content: "Parent-facing motivational interviewing prototype for the Digital Twin MI and HPV pilot.",
      },
    ],
  }),
});

function Index() {
  return <MiraChat />;
}
