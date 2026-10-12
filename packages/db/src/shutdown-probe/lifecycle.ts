import { registerSignalShutdown, startWithSignalShutdown } from "../signal-shutdown";

const mode = process.argv[2];
if (mode === "failure") {
  await startWithSignalShutdown(async () => {
    throw new Error("expected startup failure");
  }).catch(() => {
    process.stdout.write("failure returned\n");
  });
} else {
  registerSignalShutdown(async () => {
    // A competing entrypoint exit must wait for all registered cleanup.
    process.exit(1);
    await new Promise((resolve) => setTimeout(resolve, 150));
    process.stdout.write("auxiliary stopped\n");
  });
  const pending = startWithSignalShutdown(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    process.stdout.write("started\n");
    return {
      async stop() {
        await new Promise((resolve) => setTimeout(resolve, 150));
        process.stdout.write("cluster stopped\n");
      },
    };
  });
  process.send?.("starting");
  await pending;
  setInterval(() => {}, 1000);
}
