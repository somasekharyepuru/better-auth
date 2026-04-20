import { Metadata } from "next";
import { HelpContent } from "./HelpContent";
import { APP_CONFIG, getPageTitle } from "@/config/app.constants";

export const metadata: Metadata = {
  title: getPageTitle("Help Center"),
  description: "Get help with Daymark. Find guides, keyboard shortcuts, and FAQs to boost your productivity.",
  openGraph: {
    title: `Help Center | ${APP_CONFIG.name}`,
    description: "Everything you need to master your productivity with Daymark.",
    images: [{ url: "/logo.png" }],
  },
};

export default function HelpPage() {
  return <HelpContent />;
}
