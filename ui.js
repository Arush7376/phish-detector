(function () {
    const scanSteps = [
        "Initializing network probe...",
        "Extracting domain fingerprint...",
        "Checking threat database...",
        "Running heuristic analysis...",
        "Generating report..."
    ];

    const tips = [
        "Banks never ask passwords via email or SMS links.",
        "Always inspect the sender domain, not just display name.",
        "Urgency language is a common phishing pressure tactic.",
        "Hover links before clicking to inspect destination domain.",
        "Misspelled brand names are a common impersonation clue.",
        "Use MFA to reduce damage from credential theft attempts."
    ];

    let audioContext = null;

    function ensureAudioContext() {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) {
                audioContext = new AudioCtor();
            }
        }
        return audioContext;
    }

    function beep(type) {
        const ctx = ensureAudioContext();
        if (!ctx) {
            return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === "key") {
            osc.frequency.value = 330;
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
            osc.stop(now + 0.035);
        } else if (type === "success") {
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(760, now + 0.1);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            osc.stop(now + 0.21);
        } else {
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(120, now + 0.5);
            gain.gain.setValueAtTime(0.045, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
            osc.stop(now + 0.55);
        }

        osc.type = "square";
        osc.start(now);
    }

    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function typeLine(el, text, hackerMode) {
        let out = "";
        for (let i = 0; i < text.length; i += 1) {
            out += text[i];
            el.textContent = out;
            if (hackerMode && text[i] !== " ") {
                beep("key");
            }
            await wait(18);
        }
    }

    async function runScanAnimation(container, hackerMode) {
        container.innerHTML = "";
        for (let i = 0; i < scanSteps.length; i += 1) {
            const line = document.createElement("div");
            container.appendChild(line);
            await typeLine(line, `[${new Date().toLocaleTimeString()}] ${scanSteps[i]}`, hackerMode);
            await wait(120);
        }
        const cursor = document.createElement("span");
        cursor.className = "cursor";
        cursor.textContent = "_";
        container.appendChild(cursor);
    }

    function renderRisk(result) {
        const resultPanel = document.getElementById("resultPanel");
        const riskLevelEl = document.getElementById("riskLevel");
        const scoreValueEl = document.getElementById("scoreValue");
        const riskMeter = document.getElementById("riskMeter");

        riskLevelEl.textContent = result.level;
        scoreValueEl.textContent = `${result.score}%`;
        riskMeter.style.width = `${result.score}%`;

        if (result.level === "PHISHING") {
            riskLevelEl.className = "risk-text high";
            resultPanel.className = "card result-card risk-high";
        } else if (result.level === "SUSPICIOUS") {
            riskLevelEl.className = "risk-text medium";
            resultPanel.className = "card result-card risk-medium";
        } else {
            riskLevelEl.className = "risk-text low";
            resultPanel.className = "card result-card risk-low";
        }
    }

    function renderIndicators(indicators) {
        const el = document.getElementById("indicators");
        if (!indicators || indicators.length === 0) {
            el.innerHTML = "<li>No obvious phishing indicators detected.</li>";
            return;
        }
        el.innerHTML = indicators.map((item) => `<li>${item}</li>`).join("");
    }

    function renderChecks(checks) {
        const el = document.getElementById("checkList");
        if (!checks || checks.length === 0) {
            el.innerHTML = "<li>No checks available.</li>";
            return;
        }

        el.innerHTML = checks
            .map((check) => {
                const icon = check.suspicious ? "⚠" : "✔";
                return `<li>${icon} <strong>${check.name}:</strong> ${check.detail}</li>`;
            })
            .join("");
    }

    function renderPreview(result) {
        document.getElementById("previewAddress").textContent = result.normalizedUrl;
        document.getElementById("previewDomain").textContent = result.preview.domain;
        document.getElementById("previewProtocol").textContent = result.preview.protocol;
        document.getElementById("previewBrand").textContent = result.preview.brand;
    }

    function renderLearning(explanations) {
        const el = document.getElementById("learningPanel");
        el.innerHTML = explanations.map((item) => `<li>${item}</li>`).join("");
    }

    function renderTip() {
        const tip = tips[Math.floor(Math.random() * tips.length)];
        document.getElementById("tipText").textContent = tip;
    }

    function renderHistory(rows) {
        const body = document.getElementById("historyBody");
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="4">No scans yet.</td></tr>';
            return;
        }

        body.innerHTML = rows
            .map((row) => {
                return `<tr><td title="${row.url}">${row.url}</td><td>${row.score}%</td><td>${row.result}</td><td>${row.time}</td></tr>`;
            })
            .join("");
    }

    function toggleLearningPanel() {
        document.getElementById("learningPanel").classList.toggle("hidden");
    }

    function setHackerMode(enabled) {
        document.body.classList.toggle("hacker-on", !!enabled);
    }

    function playResultSound(resultLevel, hackerMode) {
        if (!hackerMode) {
            return;
        }
        if (resultLevel === "PHISHING") {
            beep("alert");
        } else {
            beep("success");
        }
    }

    function setupMatrix() {
        const canvas = document.getElementById("matrix");
        const ctx = canvas.getContext("2d");
        const glyphs = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const fontSize = 16;
        let drops = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const cols = Math.floor(canvas.width / fontSize);
            drops = Array(cols).fill(1);
        }

        function draw() {
            ctx.fillStyle = "rgba(2, 7, 2, 0.12)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(50, 226, 79, 0.82)";
            ctx.font = `${fontSize}px Consolas`;

            for (let i = 0; i < drops.length; i += 1) {
                const char = glyphs[Math.floor(Math.random() * glyphs.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillText(char, x, y);

                if (y > canvas.height && Math.random() > 0.976) {
                    drops[i] = 0;
                }
                drops[i] += 1;
            }
        }

        resize();
        setInterval(draw, 36);
        window.addEventListener("resize", resize);
    }

    window.UIModule = {
        runScanAnimation,
        renderRisk,
        renderIndicators,
        renderChecks,
        renderPreview,
        renderLearning,
        renderTip,
        renderHistory,
        toggleLearningPanel,
        setHackerMode,
        playResultSound,
        setupMatrix
    };
})();
