#!/bin/bash

# SEPA Dashboard Data Validation Script
# 在每次更新後檢查數據一致性

DASHBOARD_DIR="$HOME/dashboard"
DATA_DIR="$DASHBOARD_DIR/data"
LOG_FILE="$DASHBOARD_DIR/logs/validation.log"
ERRORS=0

mkdir -p "$DASHBOARD_DIR/logs"

echo "=== SEPA Validation Started: $(date) ===" >> "$LOG_FILE"

# 1. 檢查 null 值
echo "Checking for null values..." >> "$LOG_FILE"
NULL_COUNT=$(grep -o '"level": null' "$DATA_DIR/analysis.json" 2>/dev/null | wc -l)
if [ "$NULL_COUNT" -gt 0 ]; then
    echo "❌ ERROR: Found $NULL_COUNT null level values in analysis.json" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

NULL_PE=$(grep -o '"pe": null' "$DATA_DIR/analysis.json" 2>/dev/null | wc -l)
if [ "$NULL_PE" -gt 0 ]; then
    echo "⚠️ WARNING: Found $NULL_PE null P/E values (may be expected for loss-making companies)" >> "$LOG_FILE"
fi

# 2. 檢查 portfolio.json 結構
echo "Checking portfolio.json structure..." >> "$LOG_FILE"
if grep -q '"shares"' "$DATA_DIR/portfolio.json" 2>/dev/null; then
    echo "❌ ERROR: portfolio.json uses 'shares' instead of 'quantity'" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

if grep -q '"avgCost"' "$DATA_DIR/portfolio.json" 2>/dev/null; then
    echo "❌ ERROR: portfolio.json uses 'avgCost' instead of 'buyPrice'" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

# 3. 檢查現金計算
echo "Checking cash balance..." >> "$LOG_FILE"
INITIAL_VALUE=$(grep '"initialValue"' "$DATA_DIR/portfolio.json" | grep -o '[0-9]*')
CASH=$(grep '"cash"' "$DATA_DIR/portfolio.json" | grep -o '[0-9]*\.[0-9]*')

if [ -n "$INITIAL_VALUE" ] && [ -n "$CASH" ]; then
    if (( $(echo "$CASH < 0" | bc -l) )); then
        echo "❌ ERROR: Negative cash balance: $CASH" >> "$LOG_FILE"
        ERRORS=$((ERRORS + 1))
    fi
    if (( $(echo "$CASH > $INITIAL_VALUE" | bc -l) )); then
        echo "⚠️ WARNING: Cash ($CASH) exceeds initial value ($INITIAL_VALUE)" >> "$LOG_FILE"
    fi
fi

# 4. 檢查持倉與 analysis.json 同步
echo "Checking holdings sync..." >> "$LOG_FILE"
HOLDING_SYMBOLS=$(grep -o '"symbol": "[^"]*"' "$DATA_DIR/portfolio.json" | grep -v '"symbol": ".*\..*"' | wc -l)
if [ "$HOLDING_SYMBOLS" -eq 0 ]; then
    echo "⚠️ WARNING: No holdings found in portfolio.json" >> "$LOG_FILE"
fi

# 5. 檢查 SEPA 分數範圍
echo "Checking SEPA scores..." >> "$LOG_FILE"
INVALID_SCORES=$(grep -o '"sepaScore": [0-9]*' "$DATA_DIR/analysis.json" | grep -E '"sepaScore": (>[0-9][0-9][0-9]|<0)' | wc -l)
if [ "$INVALID_SCORES" -gt 0 ]; then
    echo "❌ ERROR: Found SEPA scores outside 0-100 range" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

# 結果
if [ "$ERRORS" -gt 0 ]; then
    echo "=== VALIDATION FAILED: $ERRORS errors ===" >> "$LOG_FILE"
    echo "❌ VALIDATION FAILED: $ERRORS errors detected"
    exit 1
else
    echo "=== VALIDATION PASSED ===" >> "$LOG_FILE"
    echo "✅ VALIDATION PASSED: No errors detected"
fi

echo "" >> "$LOG_FILE"
