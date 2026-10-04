import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSession } from "@/lib/session";
import { APP_NAME } from "../app-info";

/** Temporary entry until organization routing replaces this page. */
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-text">{APP_NAME}</h1>
      <p className="mt-2 text-text">
        Signed in as {session.user.name} ({session.user.email})
      </p>
      <div className="mt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
