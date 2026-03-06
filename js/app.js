// SEPA Dashboard - Main App

// Data paths
const DATA_PATH = 'data/';

// Load JSON data
async function loadData(filename) {
    try {
        const response = await fetch(DATA_PATH + filename);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

// Format number
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Format currency
function formatCurrency(num, currency = '$') {
    if (num === null || num === undefined) return '--';
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum >= 1e9) return `${sign}${currency}${formatNumber(absNum / 1e9, 1)}B`;
    if (absNum >= 1e6) return `${sign}${currency}${formatNumber(absNum / 1e6, 1)}M`;
    return `${sign}${currency}${formatNumber(absNum, 2)}`;
}

// Format percentage
function formatPercent(num) {
    if (num === null || num === undefined) return '--';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${formatNumber(num, 1)}%`;
}

// Get recommendation badge
function getBadge(recommendation) {
    const badges = {
        '買入': '<span class="badge buy">🟢 買入</span>',
        '觀察': '<span class="badge watch">🟡 觀察</span>',
        '避開': '<span class="badge avoid">🔴 避開</span>'
    };
    return badges[recommendation] || '<span class="badge">--</span>';
}

// Get score class
function getScoreClass(score) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Render stock table
async function renderStockTable() {
    const data = await loadData('analysis.json');
    if (!data) {
        document.getElementById('stockTableBody').innerHTML = '<tr><td colspan="12" class="loading">載入中...</td></tr>';
        return;
    }

    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = '';

    // Update last update time
    document.getElementById('lastUpdate').textContent = formatDate(data.lastUpdate);

    // Count recommendations
    let buyCount = 0, watchCount = 0, avoidCount = 0;
    const scores = [];

    data.stocks.forEach(stock => {
        // Count
        if (stock.recommendation === '買入') buyCount++;
        else if (stock.recommendation === '觀察') watchCount++;
        else avoidCount++;

        scores.push(stock.sepaScore);

        // Create row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${stock.symbol}</strong><br><small>${stock.name || ''}</small></td>
            <td>${formatCurrency(stock.price)}</td>
            <td class="${getScoreClass(stock.sepaScore)}">${stock.sepaScore}</td>
            <td>${getBadge(stock.recommendation)}</td>
            <td>${stock.trendScore || '--'}/10</td>
            <td>${stock.fundamentalScore || '--'}/10</td>
            <td>${stock.stage || '--'}</td>
            <td>${stock.catalystScore || '--'}/5</td>
            <td>${formatCurrency(stock.stopLoss)}</td>
            <td>${formatCurrency(stock.targetPrice)}</td>
            <td><small>${formatDate(stock.analysisDate)}</small></td>
            <td><button class="action-btn detail" onclick="showDetail('${stock.symbol}')">詳情</button></td>
        `;
        tbody.appendChild(row);
    });

    // Update stats
    document.getElementById('totalStocks').textContent = data.stocks.length;
    document.getElementById('buyCount').textContent = buyCount;
    document.getElementById('watchCount').textContent = watchCount;
    document.getElementById('avoidCount').textContent = avoidCount;

    // Render chart
    renderScoreChart(scores);
}

// Render score distribution chart
function renderScoreChart(scores) {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;

    // Create distribution
    const ranges = ['0-39', '40-49', '50-59', '60-69', '70-74', '75-79', '80-100'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    scores.forEach(score => {
        if (score < 40) counts[0]++;
        else if (score < 50) counts[1]++;
        else if (score < 60) counts[2]++;
        else if (score < 70) counts[3]++;
        else if (score < 75) counts[4]++;
        else if (score < 80) counts[5]++;
        else counts[6]++;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges,
            datasets: [{
                label: '股票數量',
                data: counts,
                backgroundColor: [
                    '#ef4444',
                    '#ef4444',
                    '#f59e0b',
                    '#f59e0b',
                    '#f59e0b',
                    '#10b981',
                    '#10b981'
                ],
                borderRadius: 6
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
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Show detail modal
async function showDetail(symbol) {
    const data = await loadData('analysis.json');
    if (!data) return;

    const stock = data.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>${stock.symbol} - ${stock.name || ''}</h2>
        <p><strong>分析日期:</strong> ${formatDate(stock.analysisDate)}</p>
        
        <div class="analysis-detail">
            <h3>📊 綜合評分</h3>
            <table>
                <tr><td>SEPA 總分</td><td class="${getScoreClass(stock.sepaScore)}"><strong>${stock.sepaScore}/100</strong></td></tr>
                <tr><td>建議</td><td>${getBadge(stock.recommendation)}</td></tr>
            </table>

            <h3>📈 趨勢分析 (${stock.trendScore || '--'}/10)</h3>
            <table>
                <tr><td>現價</td><td>${formatCurrency(stock.price)}</td></tr>
                <tr><td>52週高位</td><td>${formatCurrency(stock.high52w)}</td></tr>
                <tr><td>52週低位</td><td>${formatCurrency(stock.low52w)}</td></tr>
                <tr><td>vs 高位</td><td>${formatPercent(stock.vsHigh)}</td></tr>
            </table>

            <h3>💰 基本面 (${stock.fundamentalScore || '--'}/10)</h3>
            <table>
                <tr><td>營收增長</td><td>${formatPercent(stock.revenueGrowth)}</td></tr>
                <tr><td>盈利增長</td><td>${formatPercent(stock.earningsGrowth)}</td></tr>
                <tr><td>淨利率</td><td>${formatPercent(stock.netMargin)}</td></tr>
                <tr><td>ROA</td><td>${formatPercent(stock.roa)}</td></tr>
            </table>

            <h3>🎯 催化劑 (${stock.catalystScore || '--'}/5)</h3>
            <p>${stock.catalysts || '無明確催化劑'}</p>

            <h3>📍 股票階段</h3>
            <p>${stock.stage || '--'}</p>

            <h3>⚙️ 行動計劃</h3>
            <table>
                <tr><td>止損位</td><td><strong>${formatCurrency(stock.stopLoss)}</strong></td></tr>
                <tr><td>目標價</td><td><strong>${formatCurrency(stock.targetPrice)}</strong></td></tr>
                <tr><td>風險/回報比</td><td>${stock.riskReward || '--'}</td></tr>
            </table>

            <div class="summary-box">
                <strong>💡 總結:</strong> ${stock.summary || '--'}
            </div>
        </div>
    `;

    document.getElementById('detailModal').style.display = 'block';
}

// Close modal
document.querySelectorAll('.close').forEach(el => {
    el.onclick = function() {
        this.closest('.modal').style.display = 'none';
    };
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderStockTable();
    
    // Set default date for trade form
    const dateInput = document.getElementById('tradeDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
});
