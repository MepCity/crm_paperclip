import { APP_NAME } from "../app-info";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
      <p className="mt-2 text-text-muted">
        Internal CRM. The first screens arrive in the next issues.
      </p>
    </main>
  );
}
