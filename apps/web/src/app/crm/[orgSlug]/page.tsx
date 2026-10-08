import type { Metadata } from "next";
import { PageTitle } from "@/components/shell/page-title";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return <PageTitle title="Home" />;
}
