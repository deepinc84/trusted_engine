import type { Metadata } from "next";
import ServiceAssistantTest from "@/components/service-assistant/ServiceAssistantTest";
import "./service-assistant.css";

export const metadata: Metadata = { title: "Service Assistant Test", description: "Internal test-only service estimator.", robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } } };
export const dynamic = "force-dynamic";
export default function Page() { return <ServiceAssistantTest />; }
