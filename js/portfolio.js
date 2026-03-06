// Portfolio Management

let portfolio = null;
let history = null;

// Initialize portfolio page
async function initPortfolio() {
    portfolio = await loadData('portfolio.json');
    history = await loadData('history.json');
    
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
}

// Render portfolio overview
function renderPortfolio() {
    // Calculate total value
    let stockValue = 0;
    portfolio.holdings.forEach(h => {
        stockValue += (h.currentPrice || h.buyPrice) * h.quantity;
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
    
    portfolio.holdings.forEach((h, index) => {
        const currentPrice = h.currentPrice || h.buyPrice;
        const marketValue = currentPrice * h.quantity;
        const pl = (currentPrice - h.buyPrice) * h.quantity;
        const plPercent = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${h.symbol}</strong></td>
            <td>${formatCurrency(h.buyPrice)}</td>
            <td>${formatCurrency(currentPrice)}</td>
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
        tbody.innerHTML = '<tr><td colspan="7" class="loading">暫無交易記錄</td></tr>';
        return;
    }
    
    // Show most recent first
    const sortedTrades = [...history.trades].reverse();
    
    sortedTrades.forEach(trade => {
        const row = document.createElement('tr');
        const plClass = trade.pl !== undefined ? (trade.pl >= 0 ? 'profit' : 'loss') : '';
        
        row.innerHTML = `
            <td><small>${formatDate(trade.date)}</small></td>
            <td><strong>${trade.symbol}</strong></td>
            <td><span class="badge ${trade.type === 'buy' ? 'buy' : 'avoid'}">${trade.type === 'buy' ? '買入' : '賣出'}</span></td>
            <td>${formatCurrency(trade.price)}</td>
            <td>${trade.quantity}</td>
            <td>${formatCurrency(trade.total)}</td>
            <td class="${plClass}">${trade.pl !== undefined ? formatCurrency(trade.pl) : '--'}</td>
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
    
    // For demo, just show current value
    // In real app, would load historical data
    const currentValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
        return sum + (h.currentPrice || h.buyPrice) * h.quantity;
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
    
    const labels = ['現金'];
    const data = [portfolio.cash];
    const colors = ['#6b7280'];
    
    portfolio.holdings.forEach(h => {
        labels.push(h.symbol);
        data.push((h.currentPrice || h.buyPrice) * h.quantity);
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
