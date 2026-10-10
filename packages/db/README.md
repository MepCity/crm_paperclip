# Local PostgreSQL tooling

`could not create shared memory segment: No space left on device` can mean the
Darwin SysV identifier table is full, even with `shared_memory_type=mmap`.
Each PostgreSQL cluster holds a 56-byte marker. Clean shutdown releases it;
SIGKILL can leave it behind. Shared signal shutdown waits for startup and
`stop()` before exiting with 129 (SIGHUP), 130 (SIGINT), or 143 (SIGTERM).

Run `pnpm ipc:sweep` for a **dry run** showing the kernel limit, occupied/free
identifiers and each row's decision. No automatic cleanup is installed.
`pnpm ipc:sweep --apply` explicitly removes eligible rows after a fresh recheck.
On the shared development machine, do not apply against the real table without
board authorization; tests remove only their own marker.

All conditions must hold: current owner, zero attachments, exactly 56 bytes,
creator confirmed dead by ESRCH, and minimum age five minutes. Unknown process
state, foreign owners and malformed tables are protected. Darwin reports CTIME
as a time of day; the parser uses its most recent occurrence as a conservative
minimum age. This can retain older markers. Other platforms exit successfully
with an unsupported message. No kernel settings or privileges are changed.
