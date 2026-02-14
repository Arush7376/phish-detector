const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

let drops = [];
const fontSize = 16;
const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function setupMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / fontSize);
    drops = Array(cols).fill(1);
}

function drawMatrix() {
    ctx.fillStyle = "rgba(2, 7, 2, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(50, 226, 79, 0.85)";
    ctx.font = `${fontSize}px Consolas`;

    for (let i = 0; i < drops.length; i += 1) {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i] += 1;
    }
}

setupMatrix();
setInterval(drawMatrix, 36);
window.addEventListener("resize", setupMatrix);

const inputText = document.getElementById("inputText");
const scanBtn = document.getElementById("scanBtn");
const resultPanel = document.getElementById("resultPanel");
const riskLevelEl = document.getElementById("riskLevel");
const scoreValueEl = document.getElementById("scoreValue");
const indicatorsEl = document.getElementById("indicators");

function pushIndicator(indicators, condition, text, weight, scoreObj) {
    if (!condition) {
        return;
    }
    indicators.push(text);
    scoreObj.value += weight;
}

function scanText() {
    const raw = inputText.value.trim();
    const text = raw.toLowerCase();
    const indicators = [];
    const score = { value: 0 };

    if (!raw) {
        riskLevelEl.textContent = "AWAITING INPUT";
        riskLevelEl.className = "risk-text neutral";
        scoreValueEl.textContent = "0%";
        resultPanel.className = "card result-card risk-neutral";
        indicatorsEl.innerHTML = "<li>Please paste a message or URL to scan.</li>";
        return;
    }

    const keywordMap = [
        ["urgent", 8],
        ["verify", 8],
        ["password", 12],
        ["login", 10],
        ["click here", 10],
        ["account suspended", 14],
        ["bank", 8],
        ["otp", 6],
        ["winner", 8],
        ["free money", 12],
        ["reset password", 14],
        ["limited time", 8],
        ["act now", 8]
    ];

    let keywordHits = 0;
    keywordMap.forEach(([word, weight]) => {
        if (text.includes(word)) {
            keywordHits += 1;
            score.value += weight;
        }
    });
    if (keywordHits > 0) {
        indicators.push(`${keywordHits} suspicious keyword(s) detected.`);
    }

    pushIndicator(indicators, /http:\/\//.test(text), "Insecure link uses http://", 18, score);
    pushIndicator(indicators, /(bit\.ly|tinyurl|t\.co|shorturl)/.test(text), "Shortened URL detected.", 16, score);
    pushIndicator(indicators, /\b\d{1,3}(\.\d{1,3}){3}\b/.test(text), "Raw IP address found in link/message.", 15, score);
    pushIndicator(indicators, /\.(ru|tk|xyz|top|zip)\b/.test(text), "High-risk domain pattern detected.", 15, score);
    pushIndicator(indicators, /(gift card|wire transfer|crypto)/.test(text), "Payment coercion terms detected.", 12, score);
    pushIndicator(indicators, /(immediately|asap|within 24 hours)/.test(text), "Urgency pressure language detected.", 10, score);

    const risk = Math.min(score.value, 100);

    let level = "LOW";
    let levelClass = "low";
    let panelClass = "risk-low";

    if (risk >= 70) {
        level = "HIGH";
        levelClass = "high";
        panelClass = "risk-high";
    } else if (risk >= 35) {
        level = "MEDIUM";
        levelClass = "medium";
        panelClass = "risk-medium";
    }

    riskLevelEl.textContent = level;
    riskLevelEl.className = `risk-text ${levelClass}`;
    scoreValueEl.textContent = `${risk}%`;
    resultPanel.className = `card result-card ${panelClass}`;

    if (indicators.length === 0) {
        indicatorsEl.innerHTML = "<li>No obvious phishing indicators detected.</li>";
        return;
    }

    indicatorsEl.innerHTML = indicators.map((item) => `<li>${item}</li>`).join("");
}

scanBtn.addEventListener("click", scanText);
