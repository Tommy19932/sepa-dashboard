#!/bin/bash

# SEPA Dashboard Update Script
# 用於更新股票分析數據

DASHBOARD_DIR="$HOME/dashboard"
DATA_DIR="$DASHBOARD_DIR/data"
LOG_FILE="$DASHBOARD_DIR/logs/update.log"

# 確保目錄存在
mkdir -p "$DASHBOARD_DIR/logs"

# 記錄開始時間
echo "=== SEPA Update Started: $(date) ===" >> "$LOG_FILE"

# 檢查 watchlist 是否存在
if [ ! -f "$DATA_DIR/watchlist.json" ]; then
    echo "Error: watchlist.json not found" >> "$LOG_FILE"
    exit 1
fi

# 提取股票代號
# 注意：這個腳本需要配合 OpenClaw agent 使用
# agent 會讀取 watchlist.json，然後逐一分析每隻股票

# 輸出 watchlist 供 agent 使用
echo "Watchlist stocks:" >> "$LOG_FILE"
cat "$DATA_DIR/watchlist.json" >> "$LOG_FILE"

# 記錄完成時間
echo "=== SEPA Update Completed: $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 提示用戶
echo "Update script executed. Check logs at: $LOG_FILE"
