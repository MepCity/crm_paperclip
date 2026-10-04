#!/bin/sh
# Refuse new commits/merges while repository maintenance holds the lock.
LOCK="$(git rev-parse --path-format=absolute --git-common-dir)/mep-maintenance.lock"
if [ -e "$LOCK" ]; then
  echo "BLOCKED: repository maintenance is running (a few minutes)." >&2
  echo "  Nothing is lost: keep your changes, wait 3 minutes and retry the same command." >&2
  exit 1
fi
exit 0
