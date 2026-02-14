(function () {
    const scanBtn = document.getElementById("scanBtn");
    const inputUrl = document.getElementById("inputUrl");
    const scanTerminal = document.getElementById("scanTerminal");
    const whyToggleBtn = document.getElementById("whyToggleBtn");
    const hackerModeToggle = document.getElementById("hackerModeToggle");

    function formatTime(ts) {
        return new Date(ts).toLocaleString();
    }

    function renderInitialHistory() {
        const rows = window.StorageModule.getHistory();
        window.UIModule.renderHistory(rows);
    }

    async function handleScan() {
        const url = inputUrl.value.trim();
        const hackerMode = hackerModeToggle.checked;

        await window.UIModule.runScanAnimation(scanTerminal, hackerMode);

        const result = window.AnalysisEngine.analyzeUrl(url);

        if (!result.ok) {
            window.UIModule.renderRisk({ level: result.level, score: result.score });
            window.UIModule.renderIndicators([result.error]);
            window.UIModule.renderChecks([]);
            window.UIModule.renderPreview({
                normalizedUrl: "about:blank",
                preview: { domain: "-", protocol: "-", brand: "Unknown" }
            });
            window.UIModule.renderLearning([`⚠ ${result.error}`]);
            window.UIModule.renderTip();
            return;
        }

        window.UIModule.renderRisk(result);
        window.UIModule.renderIndicators(result.indicators);
        window.UIModule.renderChecks(result.checks);
        window.UIModule.renderPreview(result);
        window.UIModule.renderLearning(result.explanations);
        window.UIModule.renderTip();
        window.UIModule.playResultSound(result.level, hackerMode);

        const updated = window.StorageModule.addHistory({
            url: result.normalizedUrl,
            score: result.score,
            result: result.level,
            time: formatTime(Date.now())
        });
        window.UIModule.renderHistory(updated);
    }

    function bindEvents() {
        scanBtn.addEventListener("click", handleScan);
        inputUrl.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                handleScan();
            }
        });

        whyToggleBtn.addEventListener("click", window.UIModule.toggleLearningPanel);
        hackerModeToggle.addEventListener("change", (event) => {
            window.UIModule.setHackerMode(event.target.checked);
        });
    }

    function init() {
        window.UIModule.setupMatrix();
        renderInitialHistory();
        bindEvents();
    }

    init();
})();
