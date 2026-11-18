#!/usr/bin/env bash
# Vercel Ignored Build Step (scripts/vercel-ignore-build.sh)
# Exit 0 = Skip/Cancel deployment (saves deployment storage)
# Exit 1 = Proceed with build

echo "==> [Vercel Ignored Build Step] Checking commit..."

# 1. Skip if commit explicitly requests it
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip deploy]"* ]] || [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip vercel]"* ]]; then
  echo "Commit explicitly skipped Vercel deployment. Cancelling build."
  exit 0
fi

# 2. If commit was created with [skip ci] (e.g. automated bot sync):
#    deploy only when the commit carries a real change. A day that only
#    rolled its date stamps forward must not cost a deployment, so the
#    same detector the workflow uses decides here.
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip ci]"* ]]; then
  DIFF_BASE="HEAD~1"
  if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ]; then
    DIFF_BASE="$VERCEL_GIT_PREVIOUS_SHA"
  fi

  if node scripts/has-meaningful-change.mjs --range "$DIFF_BASE" HEAD 2>/dev/null; then
    echo "Meaningful changes detected. Proceeding with deployment build."
    exit 1
  else
    RC=$?
    if [ "$RC" -eq 1 ]; then
      echo "Only date stamps, watcher logs and non-production files changed. Cancelling build to preserve Vercel deployment storage."
      exit 0
    fi
    # RC >= 2: the detector itself could not run (shallow clone, missing
    # node) - fall back to the filename filter so a decision is still made.
    CHANGED_FILES=$(git diff --name-only "$DIFF_BASE" HEAD 2>/dev/null || true)
    echo "(detector unavailable - filename filter) Changed files: $CHANGED_FILES"
    SIGNIFICANT_CHANGES=$(echo "$CHANGED_FILES" | grep -vE "^(public/data/(source-watch|last-check)\.json|\.github/.*|README\.md|CONTEXT\.md|X_POSTS_SCHEDULE\.md|docs/.*|scripts/.*|public/llms(-full)?\.txt)$" || true)
    if [ -z "$SIGNIFICANT_CHANGES" ]; then
      echo "Only trivial non-production files changed. Cancelling build to preserve Vercel deployment storage."
      exit 0
    fi
  fi
fi

# 3. Otherwise, build as normal
echo "Significant changes detected. Proceeding with deployment build."
exit 1
