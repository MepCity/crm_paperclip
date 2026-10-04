import { Icons } from "./icon";
export default function IconDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      {Object.entries(Icons).map(([name, Icon]) => (
        <Icon key={name} role="img" aria-label={name} className="w-6 h-6 text-text" />
      ))}
    </div>
  );
}
