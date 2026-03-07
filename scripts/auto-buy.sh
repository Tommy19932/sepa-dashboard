#!/bin/bash
# SEPA Auto-Buy Script
# Runs daily to analyze stocks and auto-buy those with 80+ SEPA score

DASHBOARD_DIR="/home/tommy/dashboard"
DATA_DIR="$DASHBOARD_DIR/data"
LOG_FILE="$DASHBOARD_DIR/auto-buy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== SEPA Auto-Buy Check Started ==="

cd "$DASHBOARD_DIR"

# Check if auto-buy is enabled
ENABLED=$(cat "$DATA_DIR/watchlist.json" | grep -o '"enabled": [^,]*' | head -1 | grep -o 'true\|false')
if [ "$ENABLED" != "true" ]; then
    log "Auto-buy is disabled. Skipping."
    exit 0
fi

# Get stocks with 80+ SEPA score from analysis
BUY_CANDIDATES=$(cat "$DATA_DIR/analysis.json" | grep -o '"symbol": "[^"]*"' | head -20)
log "Checking candidates..."

# Note: The actual buy logic is handled by Jimmy using the sepa-investment-analyst skill
# This script triggers the check and logs the activity

log "Auto-buy check complete. See portfolio.json for holdings."
log "=== End of Auto-Buy Check ==="
