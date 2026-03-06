# 📊 SEPA Investment Dashboard

A stock analysis dashboard based on Mark Minervini's SEPA (Specific Entry Point Analysis) methodology.

![SEPA Dashboard](https://img.shields.io/badge/SEPA-Analysis-blue)
![Status](https://img.shields.io/badge/Status-Active-green)

## 🎯 Features

- **Stock Watchlist** - Monitor stocks with SEPA scoring (0-100)
- **Portfolio Simulation** - Track trades and P/L
- **Charts** - Score distribution, portfolio value, allocation
- **Multi-Market** - Supports US and HK stocks

## 📈 Usage

### View Dashboard
Open `index.html` in your browser or visit the GitHub Pages URL.

### Stock Analysis
Each stock is analyzed using SEPA methodology:
- Trend Analysis (20%)
- Fundamentals (30%)
- Catalysts (15%)
- Stock Stage (15%)
- Technical Patterns (10%)
- Relative Strength (5%)
- Risk Assessment (5%)

### Recommendations
| Score | Action |
|-------|--------|
| 75-100 | 🟢 Buy |
| 60-74 | 🟡 Watch |
| < 60 | 🔴 Avoid |

## 📁 Structure

```
dashboard/
├── index.html           # Watchlist page
├── portfolio.html       # Portfolio page
├── css/style.css
├── js/
│   ├── app.js
│   └── portfolio.js
└── data/
    ├── watchlist.json   # Stocks to monitor
    ├── analysis.json    # Latest analysis
    ├── portfolio.json   # Holdings
    └── history.json     # Trade history
```

## ⚠️ Disclaimer

This dashboard is for educational purposes only. Data provided is not investment advice. Always do your own research and manage risk appropriately.

---
Built with ❤️ by Jimmy (SEPA Investment Analyst)
