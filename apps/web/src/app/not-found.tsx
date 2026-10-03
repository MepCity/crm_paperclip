import { Alert } from "@/components/ui/alert";
import { Link } from "@/components/ui/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg">
      <div className="max-w-md w-full flex flex-col gap-4 items-center text-center">
        <h2 className="text-2xl font-semibold text-text">404 - Not Found</h2>
        <Alert variant="warning" title="Page not found">
          The page you are looking for does not exist.
        </Alert>
        <Link href="/" variant="primary">
          Return Home
        </Link>
      </div>
    </div>
  );
}
