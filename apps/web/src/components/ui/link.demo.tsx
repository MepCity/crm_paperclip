import { Link } from "./link";
export default function LinkDemo() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Link href="#link1" variant="text">
        Text Link
      </Link>
      <Link href="#link2" variant="primary">
        Button Link
      </Link>
      <Link href="#link3" variant="secondary">
        Secondary Link
      </Link>
    </div>
  );
}
