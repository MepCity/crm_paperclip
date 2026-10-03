import { demos } from "./demos";

export const metadata = {
  title: "Component Gallery - MepCity CRM",
};

export default function UIComponentsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-16">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-text">Component Gallery</h1>
        <p className="text-text-muted">A showcase of all available UI primitives.</p>
      </div>
      {Object.entries(demos).map(([name, Demo]) => (
        <section key={name} className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2 capitalize">
            {name.replace("-", " ")}
          </h2>
          <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
            <Demo />
          </div>
        </section>
      ))}
    </div>
  );
}
