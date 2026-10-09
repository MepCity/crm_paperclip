import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.home);

export default function HomePage() {
  return <PageTitle title={shellPageTitle.home} />;
}
