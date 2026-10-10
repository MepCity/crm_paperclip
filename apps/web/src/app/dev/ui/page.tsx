import { demos } from "./demos";

export const metadata = {
  title: "Component Gallery",
};

export default function UIComponentsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-text">Component Gallery</h1>
        <p className="text-text-muted">A showcase of all available UI primitives.</p>
      </div>
      {Object.entries(demos).map(([name, Demo]) => (
        <section key={name} aria-labelledby={`demo-${name}`} className="space-y-4">
          <h2
            id={`demo-${name}`}
            className="border-b border-border pb-2 text-2xl font-semibold capitalize"
          >
            {name.replaceAll("-", " ")}
          </h2>
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <Demo />
          </div>
        </section>
      ))}
    </div>
  );
}
