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

// Get score emoji
function getScoreEmoji(score, max = 10) {
    const pct = (score / max) * 100;
    if (pct >= 70) return '✅';
    if (pct >= 40) return '⚠️';
    return '🔴';
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

// Show detail modal - Enhanced version with full SEPA analysis
async function showDetail(symbol) {
    const data = await loadData('analysis.json');
    if (!data) return;

    const stock = data.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    // Calculate additional metrics
    const trendEmoji = stock.trendScore >= 7 ? '✅' : (stock.trendScore >= 4 ? '⚠️' : '🔴');
    const fundEmoji = stock.fundamentalScore >= 8 ? '🚀' : (stock.fundamentalScore >= 5 ? '✅' : '🔴');
    const stageEmoji = stock.stageScore >= 7 ? '✅' : (stock.stageScore >= 4 ? '⚠️' : '🔴');
    const techEmoji = stock.technicalScore >= 6 ? '✅' : (stock.technicalScore >= 3 ? '⚠️' : '🔴');
    const riskEmoji = stock.riskScore >= 7 ? '✅' : (stock.riskScore >= 4 ? '⚠️' : '🔴');

    // Generate recommendation color
    const recColor = stock.recommendation === '買入' ? '#10b981' : (stock.recommendation === '觀察' ? '#f59e0b' : '#ef4444');

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-header">
            <h2>${stock.symbol} - ${stock.name || ''}</h2>
            <div class="sepa-score-big ${getScoreClass(stock.sepaScore)}">
                SEPA ${stock.sepaScore}
            </div>
            <div class="recommendation" style="color: ${recColor}; font-size: 1.5rem; font-weight: bold;">
                ${stock.recommendation}
            </div>
        </div>

        <div class="price-info">
            <div class="price-main">
                <span class="label">現價</span>
                <span class="value">${formatCurrency(stock.price)}</span>
                <span class="change ${stock.change >= 0 ? 'profit' : 'loss'}">${formatPercent(stock.changePercent)}</span>
            </div>
            <div class="price-range">
                <span>52週: ${formatCurrency(stock.low52w)} - ${formatCurrency(stock.high52w)}</span>
            </div>
        </div>

        <hr>

        <!-- 一、趨勢分析 -->
        <section class="analysis-section">
            <h3>一、趨勢分析 ${trendEmoji}</h3>
            <table class="detail-table">
                <tr>
                    <td>現價 vs 52週高位</td>
                    <td>${formatCurrency(stock.price)} / ${formatCurrency(stock.high52w)}</td>
                    <td class="${stock.vsHigh >= -20 ? 'score-high' : (stock.vsHigh >= -40 ? 'score-mid' : 'score-low')}">
                        ${stock.vsHigh >= -10 ? '接近高位 ✅' : (stock.vsHigh >= -30 ? '回調中 ⚠️' : '大幅回調 🔴')}
                    </td>
                </tr>
                <tr>
                    <td>現價 vs 52週低位</td>
                    <td>${formatCurrency(stock.price)} / ${formatCurrency(stock.low52w)}</td>
                    <td class="score-high">+${formatNumber(Math.abs(stock.vsLow), 0)}%</td>
                </tr>
                <tr>
                    <td>趨勢評分</td>
                    <td colspan="2">${stock.trendScore}/10 ${trendEmoji}</td>
                </tr>
            </table>
            <div class="stage-box">
                <strong>股票階段:</strong> ${stock.stage}
            </div>
        </section>

        <!-- 二、基本面分析 -->
        <section class="analysis-section">
            <h3>二、基本面分析 ${fundEmoji}</h3>
            <table class="detail-table">
                <tr>
                    <td>營收增長</td>
                    <td>${formatPercent(stock.revenueGrowth)}</td>
                    <td>${stock.revenueGrowth >= 50 ? '🚀 超強' : (stock.revenueGrowth >= 20 ? '✅ 強勁' : '⚠️ 一般')}</td>
                </tr>
                <tr>
                    <td>盈利增長</td>
                    <td>${formatPercent(stock.earningsGrowth)}</td>
                    <td>${stock.earningsGrowth >= 50 ? '🚀 爆炸性' : (stock.earningsGrowth >= 20 ? '✅ 強勁' : (stock.earningsGrowth > 0 ? '⚠️ 一般' : '🔴 下滑'))}</td>
                </tr>
                <tr>
                    <td>淨利率</td>
                    <td>${formatPercent(stock.netMargin)}</td>
                    <td>${stock.netMargin >= 20 ? '✅ 優秀' : (stock.netMargin >= 10 ? '✅ 良好' : (stock.netMargin > 0 ? '⚠️ 偏低' : '🔴 虧損'))}</td>
                </tr>
                <tr>
                    <td>ROA</td>
                    <td>${formatPercent(stock.roa)}</td>
                    <td>${stock.roa >= 15 ? '✅ 優秀' : (stock.roa >= 10 ? '✅ 良好' : '⚠️ 一般')}</td>
                </tr>
                <tr>
                    <td>P/E</td>
                    <td>${stock.pe ? formatNumber(stock.pe, 1) : 'N/A'}</td>
                    <td>${!stock.pe ? '—' : (stock.pe <= 25 ? '✅ 合理' : (stock.pe <= 40 ? '⚠️ 偏高' : '🔴 高估值'))}</td>
                </tr>
                <tr>
                    <td>P/B</td>
                    <td>${stock.pb ? formatNumber(stock.pb, 1) : 'N/A'}</td>
                    <td>${!stock.pb ? '—' : (stock.pb <= 10 ? '✅ 合理' : (stock.pb <= 20 ? '⚠️ 偏高' : '🔴 高估值'))}</td>
                </tr>
                <tr>
                    <td>市值</td>
                    <td>${formatCurrency(stock.marketCap)}</td>
                    <td>${stock.marketCap >= 100e9 ? '大盤股' : (stock.marketCap >= 10e9 ? '中盤股' : '小盤股')}</td>
                </tr>
            </table>
            <div class="score-box">
                <strong>基本面評分:</strong> ${stock.fundamentalScore}/10 ${fundEmoji}
            </div>
        </section>

        <!-- 三、催化劑 -->
        <section class="analysis-section">
            <h3>三、催化劑 🎯</h3>
            <div class="catalysts-box">
                ${stock.catalysts || '無明確催化劑'}
            </div>
            <div class="score-box">
                <strong>催化劑評分:</strong> ${stock.catalystScore}/5 ${stock.catalystScore >= 4 ? '🚀' : (stock.catalystScore >= 2 ? '✅' : '⚠️')}
            </div>
        </section>

        <!-- 四、綜合評分 -->
        <section class="analysis-section">
            <h3>四、SEPA 綜合評分</h3>
            <div class="score-breakdown">
                <div class="score-item">
                    <span>趨勢</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.trendScore * 10}%; background: ${stock.trendScore >= 7 ? '#10b981' : (stock.trendScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.trendScore}/10</span>
                </div>
                <div class="score-item">
                    <span>基本面</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.fundamentalScore * 10}%; background: ${stock.fundamentalScore >= 7 ? '#10b981' : (stock.fundamentalScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.fundamentalScore}/10</span>
                </div>
                <div class="score-item">
                    <span>催化劑</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.catalystScore * 20}%; background: ${stock.catalystScore >= 4 ? '#10b981' : (stock.catalystScore >= 2 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.catalystScore}/5</span>
                </div>
                <div class="score-item">
                    <span>階段</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.stageScore * 10}%; background: ${stock.stageScore >= 7 ? '#10b981' : (stock.stageScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.stageScore}/10</span>
                </div>
                <div class="score-item">
                    <span>技術</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.technicalScore * 10}%; background: ${stock.technicalScore >= 7 ? '#10b981' : (stock.technicalScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.technicalScore}/10</span>
                </div>
                <div class="score-item">
                    <span>RS</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.rsScore * 10}%; background: ${stock.rsScore >= 7 ? '#10b981' : (stock.rsScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.rsScore}/10</span>
                </div>
                <div class="score-item">
                    <span>風險</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${stock.riskScore * 10}%; background: ${stock.riskScore >= 7 ? '#10b981' : (stock.riskScore >= 4 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <span>${stock.riskScore}/10</span>
                </div>
            </div>
        </section>

        <!-- 五、行動計劃 -->
        <section class="analysis-section action-plan">
            <h3>五、行動計劃</h3>
            <table class="action-table">
                <tr>
                    <td class="label-cell">止損位</td>
                    <td class="value-cell stop-loss">${formatCurrency(stock.stopLoss)}</td>
                    <td class="pct-cell">${formatPercent(((stock.stopLoss - stock.price) / stock.price) * 100)}</td>
                </tr>
                <tr>
                    <td class="label-cell">目標價</td>
                    <td class="value-cell target">${formatCurrency(stock.targetPrice)}</td>
                    <td class="pct-cell profit">${formatPercent(((stock.targetPrice - stock.price) / stock.price) * 100)}</td>
                </tr>
                <tr>
                    <td class="label-cell">風險/回報</td>
                    <td class="value-cell" colspan="2">${stock.riskReward || '--'}</td>
                </tr>
            </table>
        </section>

        <!-- 總結 -->
        <section class="analysis-section summary">
            <h3>💡 總結</h3>
            <p>${stock.summary || '--'}</p>
        </section>

        <div class="disclaimer">
            ⚠️ 以上分析僅供參考，不構成投資建議。投資有風險，請自行判斷。
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
