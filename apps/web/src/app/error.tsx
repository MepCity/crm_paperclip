"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg">
      <div className="max-w-md w-full flex flex-col gap-4 items-center text-center">
        <h2 className="text-2xl font-semibold text-text">Something went wrong!</h2>
        <Alert variant="danger" title="An error occurred">
          {error.message || "An unexpected error occurred."}
        </Alert>
        <Button variant="primary" onPress={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
