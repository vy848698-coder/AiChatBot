import type { Metadata } from "next";
import VoiceLabClient from "@/components/lab/VoiceLabClient";

export const metadata: Metadata = { title: "Voice Lab · Solar Saathi" };

export default function VoiceLabPage() {
  return <VoiceLabClient />;
}
