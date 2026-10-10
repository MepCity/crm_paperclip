# Local PostgreSQL tooling

`could not create shared memory segment: No space left on device` can mean the
Darwin SysV identifier table is full, even with `shared_memory_type=mmap`.
Each PostgreSQL cluster holds a 56-byte marker. Clean shutdown releases it;
SIGKILL can leave it behind. Shared signal shutdown waits for startup and
`stop()` before exiting with 129 (SIGHUP), 130 (SIGINT), or 143 (SIGTERM).

Run `pnpm ipc:sweep` for a **dry run** showing the kernel limit, occupied/free
identifiers and each row's decision. Board decision 2026-10-10 (MEP-265):
`startLocalPostgres` automatically applies this same sweep at most once per call,
only after a Darwin shared memory exhaustion failure and before the retry wait.
If any identifier is removed, the next attempt starts immediately; otherwise
normal 5-second and 15-second waits remain. The maximum stays three attempts.
Every sweep line is forwarded through `onLog` with an `[ipc-sweep]` prefix,
separate from server error output. Sweep failures do not replace the startup error.
No cleanup runs on ordinary startup, shutdown, or a schedule.
`pnpm ipc:sweep --apply` explicitly removes eligible rows after a fresh recheck.
Manual `--apply` against the real table is reserved for the board; agents do not
run it. Tests inject the command runner and never remove real machine segments.
`kern.sysv.shmmni` remains 32; agents never run `sudo` or `sysctl -w`.

All conditions must hold: current owner, zero attachments, exactly 56 bytes,
creator confirmed dead by ESRCH, and minimum age five minutes. Unknown process
state, foreign owners and malformed tables are protected. Darwin reports CTIME
as a time of day; the parser uses its most recent occurrence as a conservative
minimum age. This can retain older markers. Other platforms exit successfully
with an unsupported message. No kernel settings or privileges are changed.
