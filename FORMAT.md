# SEPA Dashboard Data Format

## analysis.json 格式規範

根據 `js/app.js` 要求，`data/analysis.json` 必須符合以下格式：

### 結構

```json
{
  "lastUpdate": "YYYY-MM-DDTHH:MM:SS+08:00",
  "stocks": [...],
  "autoBuyCandidates": [...],
  "marketSummary": {...}
}
```

### stocks 陣列每個元素必須包含

| 欄位 | 類型 | 說明 |
|------|------|------|
| `symbol` | string | 股票代號 |
| `name` | string | 公司名稱 |
| `price` | number | 現價 |
| `changePercent` | number | 漲跌幅 % |
| `low52w` | number | 52週低位 |
| `high52w` | number | 52週高位 |
| `vsHigh` | number | 距52週高位 % |
| `vsLow` | number | 距52週低位 % |
| `sepaScore` | number | SEPA 綜合評分 (0-100) |
| `recommendation` | string | **必須是：** \"買入\" / \"觀察\" / \"避開\" |
| `trendScore` | number | 趨勢評分 (1-10) |
| `fundamentalScore` | number | 基本面評分 (1-10) |
| `stage` | string | 股票階段 |
| `stageScore` | number | 階段評分 (1-10) |
| `catalystScore` | number | 催化劑評分 (1-5) |
| `technicalScore` | number | 技術評分 (1-10) |
| `rsScore` | number | RS評分 (1-10) |
| `riskScore` | number | 風險評分 (1-10) |
| `revenueGrowth` | number | 營收增長 % |
| `earningsGrowth` | number | 盈利增長 % |
| `netMargin` | number | 淨利率 % |
| `roa` | number | ROA % |
| `pe` | number | P/E |
| `pb` | number | P/B |
| `marketCap` | number | 市值 |
| `catalysts` | string | 催化劑描述 |
| `stopLoss` | number | 止損位 |
| `targetPrice` | number | 目標價 |
| `riskReward` | string | 風險回報比 |
| `summary` | string | 總結 |
| `analysisDate` | string | 分析日期 |

### 重要提醒

1. **欄位名稱必須完全一致**
   - ✅ `stocks` (不是 `analyses`)
   - ✅ `lastUpdate` (不是 `lastUpdated`)
   - ✅ `sepaScore` (不是 `score`)

2. **recommendation 必須使用中文**
   - ✅ \"買入\" / \"觀察\" / \"避開\"
   - ❌ "Buy" / "Watch" / "Avoid" / "Strong Buy"

3. **所有評分欄位必須是數字**
   - 不能是 null 或 undefined

---

最後更新：2026-03-10
