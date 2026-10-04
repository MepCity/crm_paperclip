"use client";

import { Button } from "./button";
import { toast } from "./toast";

export default function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onPress={() => toast({ variant: "info", title: "Export started" })}
      >
        Show info
      </Button>
      <Button
        variant="secondary"
        onPress={() => toast({ variant: "success", title: "Record saved" })}
      >
        Show success
      </Button>
      <Button
        variant="secondary"
        onPress={() =>
          toast({
            variant: "danger",
            title: "Could not save",
            message: "Try again in a moment.",
          })
        }
      >
        Show danger
      </Button>
    </div>
  );
}
