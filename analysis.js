(function () {
    const suspiciousKeywords = [
        "login", "verify", "account", "secure", "update", "bank", "password", "free", "prize"
    ];

    const brandKeywords = {
        google: ["google", "g00gle", "goog1e"],
        paypal: ["paypal", "paypa1", "pay-pal"],
        instagram: ["instagram", "instagrarn", "1nstagram"],
        facebook: ["facebook", "faceb00k"],
        microsoft: ["microsoft", "micr0soft"],
        apple: ["apple", "app1e", "icloud"],
        amazon: ["amazon", "amaz0n"]
    };

    function tryParseUrl(input) {
        const raw = String(input || "").trim();
        if (!raw) {
            return { raw: "", url: null, normalized: "", error: "empty" };
        }

        try {
            const parsed = new URL(raw);
            return { raw, url: parsed, normalized: parsed.href, error: null };
        } catch (err) {
            try {
                const parsed = new URL(`http://${raw}`);
                return { raw, url: parsed, normalized: parsed.href, error: null };
            } catch (nestedErr) {
                return { raw, url: null, normalized: "", error: "invalid" };
            }
        }
    }

    function isIpHost(hostname) {
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    }

    function getDomainCore(hostname) {
        const parts = hostname.split(".").filter(Boolean);
        if (parts.length < 2) {
            return hostname;
        }
        return parts[parts.length - 2];
    }

    function detectBrand(urlText) {
        const lower = urlText.toLowerCase();
        for (const [brand, terms] of Object.entries(brandKeywords)) {
            if (terms.some((term) => lower.includes(term))) {
                return brand[0].toUpperCase() + brand.slice(1);
            }
        }
        return "Unknown";
    }

    function hasLeetspeakLikeDomain(domainCore) {
        if (!/[a-z]/i.test(domainCore) || !/\d/.test(domainCore)) {
            return false;
        }
        return /[a-z][01345789]|[01345789][a-z]/i.test(domainCore);
    }

    function makeCheck(name, suspicious, detail, points) {
        return {
            name,
            suspicious,
            detail,
            points: suspicious ? points : 0
        };
    }

    function analyzeUrl(input) {
        const parsed = tryParseUrl(input);
        if (parsed.error === "empty") {
            return {
                ok: false,
                error: "Please enter a URL.",
                score: 0,
                level: "SAFE"
            };
        }

        if (parsed.error === "invalid") {
            return {
                ok: false,
                error: "Invalid URL format.",
                score: 25,
                level: "SUSPICIOUS"
            };
        }

        const urlObj = parsed.url;
        const urlText = parsed.normalized;
        const hostname = urlObj.hostname.toLowerCase();
        const protocol = urlObj.protocol.replace(":", "").toUpperCase();
        const domainCore = getDomainCore(hostname);
        const ipHost = isIpHost(hostname);

        const checks = [];
        checks.push(makeCheck(
            "URL length",
            urlText.length > 75,
            urlText.length > 75 ? `Length ${urlText.length} is unusually long.` : `Length ${urlText.length} is normal.`,
            12
        ));

        checks.push(makeCheck(
            "IP address host",
            ipHost,
            ipHost ? "Using IP instead of domain can hide attacker identity." : "Domain host detected.",
            16
        ));

        checks.push(makeCheck(
            "@ symbol usage",
            parsed.raw.includes("@"),
            parsed.raw.includes("@") ? "@ can mask real destination in crafted links." : "No @ obfuscation found.",
            14
        ));

        const subdomainCount = ipHost ? 0 : Math.max(0, hostname.split(".").length - 2);
        checks.push(makeCheck(
            "Too many subdomains",
            subdomainCount >= 3,
            subdomainCount >= 3 ? `${subdomainCount} subdomains detected.` : `${subdomainCount} subdomain(s) detected.`,
            10
        ));

        checks.push(makeCheck(
            "Hyphens in domain",
            domainCore.includes("-"),
            domainCore.includes("-") ? "Hyphenated domains often mimic trusted brands." : "No suspicious hyphen pattern in domain core.",
            8
        ));

        const keywordHits = suspiciousKeywords.filter((word) => urlText.toLowerCase().includes(word));
        checks.push(makeCheck(
            "Suspicious keywords",
            keywordHits.length > 0,
            keywordHits.length > 0 ? `Detected: ${keywordHits.join(", ")}` : "No high-risk keywords found.",
            Math.min(20, keywordHits.length * 4)
        ));

        checks.push(makeCheck(
            "Protocol security",
            urlObj.protocol === "http:",
            urlObj.protocol === "http:" ? "HTTP is unencrypted and risky for credentials." : "HTTPS detected.",
            12
        ));

        checks.push(makeCheck(
            "Punycode detection",
            hostname.includes("xn--"),
            hostname.includes("xn--") ? "Punycode may indicate homograph attack." : "No punycode pattern found.",
            18
        ));

        const leetspeak = hasLeetspeakLikeDomain(domainCore);
        checks.push(makeCheck(
            "Letter replacement with numbers",
            leetspeak,
            leetspeak ? "Numeric substitutions suggest brand impersonation." : "No obvious numeric impersonation pattern.",
            12
        ));

        let score = checks.reduce((acc, check) => acc + check.points, 0);
        score = Math.max(0, Math.min(100, score));

        let level = "SAFE";
        if (score >= 70) {
            level = "PHISHING";
        } else if (score >= 35) {
            level = "SUSPICIOUS";
        }

        const impersonation = detectBrand(`${hostname}${urlObj.pathname}`);
        if (impersonation !== "Unknown" && hostname.indexOf(impersonation.toLowerCase()) === -1) {
            score = Math.min(100, score + 8);
            if (score >= 70) {
                level = "PHISHING";
            } else if (score >= 35) {
                level = "SUSPICIOUS";
            }
        }

        const triggered = checks.filter((c) => c.suspicious);
        const explanations = [];
        triggered.forEach((c) => {
            explanations.push(`⚠ ${c.detail}`);
        });

        if (impersonation !== "Unknown" && hostname.indexOf(impersonation.toLowerCase()) === -1) {
            explanations.push(`⚠ Possible ${impersonation} impersonation pattern found.`);
        }

        if (explanations.length === 0) {
            explanations.push("No major phishing indicators were detected in this URL.");
        }

        return {
            ok: true,
            input: parsed.raw,
            normalizedUrl: urlText,
            hostname,
            protocol,
            score,
            level,
            checks,
            indicators: triggered.map((c) => c.detail),
            explanations,
            preview: {
                domain: hostname,
                protocol,
                brand: impersonation
            }
        };
    }

    window.AnalysisEngine = {
        analyzeUrl
    };
})();
