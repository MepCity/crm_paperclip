import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Link } from "@/components/ui/link";
import { hrefWithNext, readNextParam } from "@/lib/safe-next-path";
import { getSession } from "@/lib/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = readNextParam((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-text">Sign in</h2>
      <SignInForm next={next} />
      <p className="text-sm text-text-muted">
        No account yet?{" "}
        <Link href={hrefWithNext("/sign-up", next)} className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
