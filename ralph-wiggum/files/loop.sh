#!/bin/bash
# PRJ Construction Ralph Loop
#
# Usage: ./loop.sh [mode] [max_iterations]
# Modes:
#   (none)     - Build mode, unlimited iterations
#   plan       - Full planning mode
#   slc        - SLC release planning mode
#   <number>   - Build mode with max iterations
#
# Examples:
#   ./loop.sh              # Build mode, unlimited
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Full planning, unlimited
#   ./loop.sh plan 5       # Full planning, max 5 iterations
#   ./loop.sh slc          # SLC release planning, unlimited
#   ./loop.sh slc 3        # SLC planning, max 3 iterations

set -euo pipefail

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Change to project root for git operations and source code access
cd "$PROJECT_ROOT"

# Parse arguments
if [ "${1:-}" = "plan" ]; then
    MODE="plan"
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_plan.md"
    MAX_ITERATIONS=${2:-0}
elif [ "${1:-}" = "slc" ]; then
    MODE="slc"
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_plan_slc.md"
    MAX_ITERATIONS=${2:-0}
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
    MODE="build"
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_build.md"
    MAX_ITERATIONS=$1
else
    MODE="build"
    PROMPT_FILE="$SCRIPT_DIR/PROMPT_build.md"
    MAX_ITERATIONS=0
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRJ Construction - Ralph Loop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mode:     $MODE"
echo "Prompt:   $(basename "$PROMPT_FILE")"
echo "Branch:   $CURRENT_BRANCH"
echo "Root:     $PROJECT_ROOT"
[ $MAX_ITERATIONS -gt 0 ] && echo "Max:      $MAX_ITERATIONS iterations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    exit 1
fi

# Verify AGENTS.md exists
if [ ! -f "$SCRIPT_DIR/AGENTS.md" ]; then
    echo "Error: $SCRIPT_DIR/AGENTS.md not found"
    exit 1
fi

while true; do
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -ge $MAX_ITERATIONS ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Reached max iterations: $MAX_ITERATIONS"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        break
    fi

    # Run Ralph iteration with selected prompt
    # -p: Headless mode (non-interactive, reads from stdin)
    # --dangerously-skip-permissions: Auto-approve all tool calls (YOLO mode)
    # --output-format=stream-json: Structured output for logging/monitoring
    # --model opus: Primary agent uses Opus for complex reasoning
    # --verbose: Detailed execution logging
    #
    # Context loaded each iteration:
    # - PROMPT_*.md (piped via stdin)
    # - AGENTS.md (referenced with @ in prompt)
    # - IMPLEMENTATION_PLAN.md (referenced with @ in prompt)
    # - specs/* (read by subagents)
    # - ../src/* and ../convex/* (read by subagents)

    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --output-format=stream-json \
        --model opus \
        --verbose

    # Push changes after each iteration (auto-push enabled)
    CURRENT_BRANCH=$(git branch --show-current)
    git push origin "$CURRENT_BRANCH" 2>/dev/null || {
        echo "Creating remote branch..."
        git push -u origin "$CURRENT_BRANCH"
    }

    ITERATION=$((ITERATION + 1))
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    LOOP $ITERATION COMPLETE"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
done
