import { Icons } from "./icon";
import { Link } from "./link";
export default function LinkDemo() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="w-(--size-rail-width) bg-rail-surface p-(--size-rail-inset)">
        <Link href="#home" variant="rail" aria-current="page">
          Home
        </Link>
        <Link href="#other" variant="rail">
          Other page
        </Link>
        <Link href="#nested" variant="railNested">
          Nested page
        </Link>
      </div>
      <Link href="#settings" variant="icon" aria-label="Settings">
        <Icons.settings className="size-(--size-topbar-icon)" aria-hidden />
      </Link>
      <Link href="#link1" variant="text">
        Text Link
      </Link>
      <Link href="#link2" variant="primary">
        Button Link
      </Link>
      <Link href="#link3" variant="secondary">
        Secondary Link
      </Link>
      <Link href="#ghost" variant="ghost">
        Ghost Link
      </Link>
      <Link href="#danger" variant="danger">
        Danger Link
      </Link>
      <Link href="#small" variant="primary" size="sm">
        Small Link
      </Link>
      <Link href="#disabled" isDisabled>
        Disabled Link
      </Link>
    </div>
  );
}
