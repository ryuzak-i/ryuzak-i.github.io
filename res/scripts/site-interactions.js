(() => {
    async function synchronizePageLabels(languageCode) {
        const defaultDictionary = await loadTranslations(localizationSettings.defaultLanguageCode);
        const selectedDictionary = await loadTranslations(languageCode);
        const dictionary = { ...defaultDictionary, ...selectedDictionary };

        for (const element of document.querySelectorAll("[data-i18n-label]")) {
            const label = dictionary[element.dataset.i18nLabel];
            if (label) element.setAttribute("aria-label", label);
        }
    }

    function onLanguageChange(languageCode) {
        synchronizePageLabels(languageCode).catch(error => {
            console.error("Page labels could not be updated.", error);
        });
    }

    document.addEventListener("languagechange", event => onLanguageChange(event.detail.languageCode));
    if (typeof activeLanguageCode !== "undefined" && activeLanguageCode) onLanguageChange(activeLanguageCode);

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if ("IntersectionObserver" in window) {
        const revealElements = document.querySelectorAll("[data-reveal]");
        const revealObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.remove("reveal-pending");
                revealObserver.unobserve(entry.target);
            }
        }, { rootMargin: "0px 0px -8%", threshold: 0.04 });

        if (!reducedMotion.matches) {
            for (const element of revealElements) {
                element.classList.add("reveal-pending");
            }

            // Allow the hidden state to paint before revealing above-the-fold content.
            requestAnimationFrame(() => requestAnimationFrame(() => {
                for (const element of revealElements) {
                    if (element.getBoundingClientRect().top < innerHeight * 0.92) {
                        element.classList.remove("reveal-pending");
                    } else {
                        revealObserver.observe(element);
                    }
                }
            }));
        }
        reducedMotion.addEventListener("change", event => {
            if (!event.matches) return;
            revealObserver.disconnect();
            for (const element of revealElements) element.classList.remove("reveal-pending");
        });
        document.addEventListener("focusin", event => {
            const pendingSection = event.target.closest(".reveal-pending");
            if (pendingSection) {
                pendingSection.classList.remove("reveal-pending");
                revealObserver.unobserve(pendingSection);
            }
        });
    }

    const navigationLinks = document.querySelectorAll('.workspace-explorer nav a');
    const sections = ["profile", "projects", "experience", "tools", "education", "about"]
        .map(id => document.getElementById(id))
        .filter(Boolean);
    if (navigationLinks.length && sections.length) {
        let updateScheduled = false;

        function updateCurrentSection() {
            updateScheduled = false;
            // A single point below the sticky navigation decides which section is active.
            const marker = Math.min(innerHeight * 0.3, 220);
            let activeSection = sections[0];
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= marker) activeSection = section;
                else break;
            }
            // Short final sections cannot always reach the marker before scrolling ends.
            if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
                activeSection = sections.at(-1);
            }
            for (const link of navigationLinks) {
                if (link.hash === `#${activeSection.id}`) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            }
        }

        function scheduleNavigationUpdate() {
            if (updateScheduled) return;
            updateScheduled = true;
            requestAnimationFrame(updateCurrentSection);
        }

        addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
        addEventListener("resize", scheduleNavigationUpdate);
        addEventListener("load", scheduleNavigationUpdate, { once: true });
        document.addEventListener("languagechange", scheduleNavigationUpdate);
        scheduleNavigationUpdate();
    }
})();
