// Portfolio Management

let portfolio = null;
let history = null;
let watchlist = null;
let analysis = null;

// Initialize portfolio page
async function initPortfolio() {
    portfolio = await loadData('portfolio.json');
    history = await loadData('history.json');
    watchlist = await loadData('watchlist.json');
    analysis = await loadData('analysis.json');
    
    if (!portfolio) {
        portfolio = {
            cash: 100000,  // 初始資金 $100,000
            holdings: [],
            initialValue: 100000
        };
    }
    
    if (!history) {
        history = {
            trades: []
        };
    }
    
    renderPortfolio();
    renderTradeHistory();
    renderCharts();
    renderAutoBuySettings();
    checkAutoBuyCandidates();
}

// Render auto-buy settings
function renderAutoBuySettings() {
    const container = document.getElementById('autoBuySettings');
    if (!container || !watchlist?.autoBuySettings) return;
    
    const settings = watchlist.autoBuySettings;
    const statusClass = settings.enabled ? 'enabled' : 'disabled';
    const statusText = settings.enabled ? '✅ 已啟用' : '❌ 已停用';
    
    container.innerHTML = `
        <div class="auto-buy-header">
            <h3>🤖 自動買入設定</h3>
            <span class="auto-buy-status ${statusClass}">${statusText}</span>
        </div>
        <div class="auto-buy-details">
            <div class="setting-item">
                <span class="label">最低 SEPA 分數</span>
                <span class="value">${settings.minScore} 分</span>
            </div>
            <div class="setting-item">
                <span class="label">每隻股票上限</span>
                <span class="value">$${settings.maxPositionSize.toLocaleString()}</span>
            </div>
            <div class="setting-item">
                <span class="label">最多持倉數量</span>
                <span class="value">${settings.maxPositions} 隻</span>
            </div>
            <div class="setting-item">
                <span class="label">上次檢查</span>
                <span class="value">${formatDate(settings.lastCheck)}</span>
            </div>
        </div>
    `;
}

// Check and display auto-buy candidates
function checkAutoBuyCandidates() {
    const container = document.getElementById('autoBuyCandidates');
    if (!container || !analysis || !watchlist?.autoBuySettings) return;
    
    const settings = watchlist.autoBuySettings;
    const minScore = settings.minScore;
    
    // Filter stocks with score >= minScore and not already held
    const heldSymbols = portfolio.holdings.map(h => h.symbol);
    const candidates = analysis.stocks.filter(s => 
        s.sepaScore >= minScore && 
        !heldSymbols.includes(s.symbol) &&
        s.recommendation === '買入'
    );
    
    if (candidates.length === 0) {
        container.innerHTML = `
            <div class="no-candidates">
                <span>📭</span>
                <p>目前沒有符合條件的自動買入候選股</p>
                <small>需要 SEPA 分數 ≥ ${minScore} 且建議為「買入」</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4>🎯 自動買入候選 (${candidates.length})</h4>
        <div class="candidates-list">
            ${candidates.map(s => `
                <div class="candidate-card">
                    <div class="candidate-header">
                        <span class="symbol">${s.symbol}</span>
                        <span class="score ${getScoreClass(s.sepaScore)}">${s.sepaScore}</span>
                    </div>
                    <div class="candidate-details">
                        <div class="detail-row">
                            <span>現價</span>
                            <span>${formatCurrency(s.price)}</span>
                        </div>
                        <div class="detail-row">
                            <span>止損</span>
                            <span class="stop-loss">${formatCurrency(s.stopLoss)}</span>
                        </div>
                        <div class="detail-row">
                            <span>目標</span>
                            <span class="target">${formatCurrency(s.targetPrice)}</span>
                        </div>
                    </div>
                    <button class="btn-buy" onclick="manualBuy('${s.symbol}', ${s.price}, ${s.stopLoss})">
                        手動買入
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Manual buy from candidate
function manualBuy(symbol, price, stopLoss) {
    document.getElementById('tradeSymbol').value = symbol;
    document.getElementById('tradeType').value = 'buy';
    document.getElementById('tradePrice').value = price;
    document.getElementById('tradeStopLoss').value = stopLoss;
    document.getElementById('tradeDate').valueAsDate = new Date();
    
    // Scroll to form
    document.getElementById('tradeForm').scrollIntoView({ behavior: 'smooth' });
}

// Render portfolio overview
function renderPortfolio() {
    // Calculate total value (with currency conversion)
    const rate = 7.8; // USD to HKD exchange rate
    let stockValue = 0;
    portfolio.holdings.forEach(h => {
        const price = h.currentPrice || h.buyPrice;
        const value = h.value || (price * h.quantity); // Use pre-calculated value if available
        
        if (h.symbol.includes('.HK')) {
            // Hong Kong stocks - already in HKD
            stockValue += price * h.quantity;
        } else {
            // US stocks - convert USD to HKD
            stockValue += price * h.quantity * rate;
        }
    });
    
    const totalValue = portfolio.cash + stockValue;
    const totalPL = totalValue - portfolio.initialValue;
    const totalPLPercent = (totalPL / portfolio.initialValue) * 100;
    
    // Update stats
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('cashBalance').textContent = formatCurrency(portfolio.cash);
    document.getElementById('stockValue').textContent = formatCurrency(stockValue);
    document.getElementById('totalPL').textContent = formatCurrency(totalPL);
    document.getElementById('totalPLPercent').textContent = formatPercent(totalPLPercent);
    
    // Color coding
    const plCard = document.getElementById('totalPLCard');
    plCard.classList.remove('green', 'red');
    plCard.classList.add(totalPL >= 0 ? 'green' : 'red');
    
    // Calculate win rate
    const closedTrades = history.trades.filter(t => t.type === 'sell');
    const wins = closedTrades.filter(t => t.pl > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    document.getElementById('winRate').textContent = formatNumber(winRate, 0) + '%';
    
    // Render holdings table
    renderHoldings();
}

// Render holdings table
function renderHoldings() {
    const tbody = document.getElementById('holdingsBody');
    tbody.innerHTML = '';
    
    if (portfolio.holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="loading">暫無持倉</td></tr>';
        return;
    }
    
    const rate = 7.8; // USD to HKD exchange rate
    
    portfolio.holdings.forEach((h, index) => {
        const currentPrice = h.currentPrice || h.buyPrice;
        const isHK = h.symbol.includes('.HK');
        
        // Calculate values with proper currency conversion
        let marketValue, pl, plPercent, displayPrice, displayBuyPrice;
        
        if (isHK) {
            // HK stocks - already in HKD
            marketValue = currentPrice * h.quantity;
            pl = (currentPrice - h.buyPrice) * h.quantity;
            plPercent = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
            displayPrice = currentPrice;
            displayBuyPrice = h.buyPrice;
        } else {
            // US stocks - convert to HKD for display
            marketValue = currentPrice * h.quantity * rate;
            pl = (currentPrice - h.buyPrice) * h.quantity * rate;
            plPercent = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
            displayPrice = currentPrice; // Keep USD for price display
            displayBuyPrice = h.buyPrice;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${h.symbol}</strong></td>
            <td>${formatCurrency(displayBuyPrice)}</td>
            <td>${formatCurrency(displayPrice)}</td>
            <td>${h.quantity}</td>
            <td>${formatCurrency(marketValue)}</td>
            <td class="${pl >= 0 ? 'profit' : 'loss'}">${formatCurrency(pl)}</td>
            <td class="${pl >= 0 ? 'profit' : 'loss'}">${formatPercent(plPercent)}</td>
            <td class="${getScoreClass(h.sepaScore || 0)}">${h.sepaScore || '--'}</td>
            <td>${formatCurrency(h.stopLoss)}</td>
            <td><small>${formatDate(h.buyDate)}</small></td>
            <td>
                <button class="action-btn sell" onclick="openSellModal('${h.symbol}', ${index})">賣出</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render trade history
function renderTradeHistory() {
    const tbody = document.getElementById('tradeHistoryBody');
    tbody.innerHTML = '';
    
    if (history.trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">暫無交易記錄</td></tr>';
        return;
    }
    
    // Show most recent first
    const sortedTrades = [...history.trades].reverse();
    
    sortedTrades.forEach(trade => {
        const row = document.createElement('tr');
        const plClass = trade.pl !== undefined ? (trade.pl >= 0 ? 'profit' : 'loss') : '';
        const autoBadge = trade.autoBought 
            ? '<span class="badge auto">🤖 自動</span>' 
            : '<span class="badge manual">👤 手動</span>';
        const typeBadge = trade.type === 'buy' 
            ? '<span class="badge buy">買入</span>' 
            : '<span class="badge sell">賣出</span>';
        
        // Get SEPA score from analysis if available
        let sepaScore = trade.sepaScore || '--';
        if (sepaScore === '--' && analysis) {
            const stock = analysis.stocks.find(s => s.symbol === trade.symbol);
            if (stock) sepaScore = stock.sepaScore;
        }
        
        row.innerHTML = `
            <td><small>${formatDate(trade.date)}</small></td>
            <td><strong>${trade.symbol}</strong></td>
            <td>${typeBadge} ${autoBadge}</td>
            <td>${formatCurrency(trade.price)}</td>
            <td>${trade.quantity}</td>
            <td><strong>${formatCurrency(trade.total)}</strong></td>
            <td class="score-cell ${getScoreClass(sepaScore)}">${sepaScore}</td>
            <td class="${plClass}">${trade.pl !== undefined ? formatCurrency(trade.pl) : '--'}</td>
            <td class="note-cell"><small>${trade.note || '--'}</small></td>
        `;
        tbody.appendChild(row);
    });
}

// Handle trade form submission
document.getElementById('tradeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const symbol = document.getElementById('tradeSymbol').value.toUpperCase();
    const type = document.getElementById('tradeType').value;
    const price = parseFloat(document.getElementById('tradePrice').value);
    const quantity = parseInt(document.getElementById('tradeQuantity').value);
    const date = document.getElementById('tradeDate').value;
    const stopLoss = parseFloat(document.getElementById('tradeStopLoss').value) || null;
    const note = document.getElementById('tradeNote').value;
    
    const total = price * quantity;
    
    if (type === 'buy') {
        // Check if enough cash
        if (total > portfolio.cash) {
            alert('現金不足！');
            return;
        }
        
        // Check if already holding
        const existingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
        
        if (existingIndex >= 0) {
            // Add to existing position
            const existing = portfolio.holdings[existingIndex];
            const totalQuantity = existing.quantity + quantity;
            const avgPrice = ((existing.buyPrice * existing.quantity) + (price * quantity)) / totalQuantity;
            
            existing.quantity = totalQuantity;
            existing.buyPrice = avgPrice;
            existing.buyDate = date;
        } else {
            // New position
            portfolio.holdings.push({
                symbol,
                buyPrice: price,
                quantity,
                buyDate: date,
                stopLoss,
                note
            });
        }
        
        portfolio.cash -= total;
        
    } else if (type === 'sell') {
        // Find holding
        const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
        
        if (holdingIndex < 0) {
            alert('未有此股票持倉！');
            return;
        }
        
        const holding = portfolio.holdings[holdingIndex];
        
        if (quantity > holding.quantity) {
            alert('賣出數量超過持倉數量！');
            return;
        }
        
        // Calculate P/L
        const pl = (price - holding.buyPrice) * quantity;
        
        // Update holding
        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            portfolio.holdings.splice(holdingIndex, 1);
        }
        
        portfolio.cash += total;
        
        // Record P/L in trade
        history.trades[history.trades.length - 1] = {
            ...history.trades[history.trades.length - 1],
            pl
        };
    }
    
    // Add to trade history
    history.trades.push({
        date,
        symbol,
        type,
        price,
        quantity,
        total,
        note
    });
    
    // Save (in real app, would save to server)
    // For now, just update display
    renderPortfolio();
    renderTradeHistory();
    renderCharts();
    
    // Reset form
    this.reset();
    document.getElementById('tradeDate').valueAsDate = new Date();
    
    alert('交易已記錄！');
});

// Open sell modal
function openSellModal(symbol, index) {
    const holding = portfolio.holdings[index];
    
    document.getElementById('sellSymbol').value = symbol;
    document.getElementById('sellSymbolDisplay').value = symbol;
    document.getElementById('sellQuantity').max = holding.quantity;
    document.getElementById('sellQuantity').value = holding.quantity;
    document.getElementById('sellPrice').value = holding.currentPrice || holding.buyPrice;
    document.getElementById('sellDate').valueAsDate = new Date();
    
    document.getElementById('sellModal').style.display = 'block';
}

// Handle sell form
document.getElementById('sellForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const symbol = document.getElementById('sellSymbol').value;
    const price = parseFloat(document.getElementById('sellPrice').value);
    const quantity = parseInt(document.getElementById('sellQuantity').value);
    const date = document.getElementById('sellDate').value;
    
    // Close modal
    document.getElementById('sellModal').style.display = 'none';
    
    // Fill in main form and submit
    document.getElementById('tradeSymbol').value = symbol;
    document.getElementById('tradeType').value = 'sell';
    document.getElementById('tradePrice').value = price;
    document.getElementById('tradeQuantity').value = quantity;
    document.getElementById('tradeDate').value = date;
    
    // Trigger form submission
    document.getElementById('tradeForm').dispatchEvent(new Event('submit'));
});

// Render charts
function renderCharts() {
    renderPortfolioChart();
    renderAllocationChart();
}

// Portfolio value over time
function renderPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;
    
    const rate = 7.8; // USD to HKD exchange rate
    
    // Calculate current value with proper currency conversion
    const currentValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
        const price = h.currentPrice || h.buyPrice;
        if (h.symbol.includes('.HK')) {
            return sum + price * h.quantity;
        } else {
            return sum + price * h.quantity * rate;
        }
    }, 0);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['開始', '現在'],
            datasets: [{
                label: '資產價值',
                data: [portfolio.initialValue, currentValue],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Allocation pie chart
function renderAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;
    
    const rate = 7.8; // USD to HKD exchange rate
    const labels = ['現金'];
    const data = [portfolio.cash];
    const colors = ['#6b7280'];
    
    portfolio.holdings.forEach(h => {
        labels.push(h.symbol);
        const price = h.currentPrice || h.buyPrice;
        if (h.symbol.includes('.HK')) {
            data.push(price * h.quantity);
        } else {
            data.push(price * h.quantity * rate);
        }
        colors.push('#3b82f6');
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initPortfolio);
