(function () {
    const KEY = "phish_detector_history_v1";

    function getHistory() {
        try {
            const raw = localStorage.getItem(KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function saveHistory(entries) {
        localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 10)));
    }

    function addHistory(item) {
        const current = getHistory();
        const next = [item, ...current].slice(0, 10);
        saveHistory(next);
        return next;
    }

    window.StorageModule = {
        getHistory,
        addHistory
    };
})();
