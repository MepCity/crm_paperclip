import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Link } from "@/components/ui/link";
import { hrefWithNext, readNextParam } from "@/lib/safe-next-path";
import { getSession } from "@/lib/session";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = readNextParam((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-text">Sign up</h2>
      <SignUpForm next={next} />
      <p className="text-sm text-text-muted">
        Already have an account?{" "}
        <Link href={hrefWithNext("/sign-in", next)} className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
