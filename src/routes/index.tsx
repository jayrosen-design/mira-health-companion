import { createFileRoute } from "@tanstack/react-router";
import { MiraChat } from "@/components/mira/MiraChat";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Mira – Health Education Assistant" },
      {
        name: "description",
        content:
          "Mira is a conversational AI that supports parents with empathetic, evidence-based education about the HPV vaccine.",
      },
      { property: "og:title", content: "Mira – Health Education Assistant" },
      {
        property: "og:description",
        content: "Empathetic conversational guide for HPV vaccine questions.",
      },
    ],
  }),
});

function Index() {
  return <MiraChat />;
}
