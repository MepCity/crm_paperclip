#!/bin/sh
# Re-author the commit just created as the repository owner, so GitHub
# attributes it to the owner's account. Called by post-commit / post-merge.
# The owner identity lives only in local git config (mep.ownerName,
# mep.ownerEmail) and never in tracked files. Which agent and model did the
# work is still recorded by the Agent:/Model: trailers.
[ -n "$MEP_IDENTITY_FIX" ] && exit 0
MODE="${1:-commit}"
NAME=$(git config --get mep.ownerName) || exit 0
EMAIL=$(git config --get mep.ownerEmail) || exit 0
[ -n "$NAME" ] && [ -n "$EMAIL" ] || exit 0
# Leave multi-step operations alone (rebase, cherry-pick, revert, bisect).
for p in rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG sequencer; do
  [ -e "$(git rev-parse --git-path "$p")" ] && exit 0
done
OLD=$(git rev-parse -q --verify HEAD) || exit 0
[ "$(git log -1 --format='%an|%ae|%cn|%ce' "$OLD")" = "$NAME|$EMAIL|$NAME|$EMAIL" ] && exit 0
PARENT_COUNT=$(git log -1 --format=%P "$OLD" | wc -w | tr -d ' ')
if [ "$MODE" = "merge" ]; then
  # Only a merge commit this merge just created; a fast-forward moves to an existing commit.
  [ "$PARENT_COUNT" -ge 2 ] || exit 0
  AGE=$(( $(date +%s) - $(git log -1 --format=%ct "$OLD") ))
  [ "$AGE" -le 300 ] || exit 0
fi
# Never touch a commit that is already on the remote.
[ -n "$(git branch -r --contains "$OLD" 2>/dev/null)" ] && exit 0
PARENTS=""
for p in $(git log -1 --format=%P "$OLD"); do PARENTS="$PARENTS -p $p"; done
NEW=$(git cat-file commit "$OLD" | sed '1,/^$/d' | MEP_IDENTITY_FIX=1 \
  GIT_AUTHOR_NAME="$NAME" GIT_AUTHOR_EMAIL="$EMAIL" \
  GIT_AUTHOR_DATE="$(git log -1 --format='%ad' --date=raw "$OLD")" \
  GIT_COMMITTER_NAME="$NAME" GIT_COMMITTER_EMAIL="$EMAIL" \
  GIT_COMMITTER_DATE="$(git log -1 --format='%cd' --date=raw "$OLD")" \
  git commit-tree "$OLD^{tree}" $PARENTS) || exit 0
git update-ref -m "identity: author as repository owner" HEAD "$NEW" "$OLD" || exit 0
exit 0
