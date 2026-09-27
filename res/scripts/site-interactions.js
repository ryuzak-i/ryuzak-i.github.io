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

    const navigationElement = document.querySelector('.workspace-explorer nav');
    const navigationLinks = navigationElement?.querySelectorAll("a") ?? [];
    const sections = ["profile", "projects", "experience", "tools", "education", "about"]
        .map(id => document.getElementById(id))
        .filter(Boolean);
    if (navigationLinks.length && sections.length) {
        let updateScheduled = false;
        let activeSectionId = null;
        let requestedSectionId = null;
        let navigationSettleTimeoutId;

        function revealActiveNavigationLink(activeLink, useSmoothScroll) {
            if (navigationElement.scrollWidth <= navigationElement.clientWidth) {
                return;
            }

            const navigationBounds = navigationElement.getBoundingClientRect();
            const linkBounds = activeLink.getBoundingClientRect();
            const centeredScrollPosition = navigationElement.scrollLeft
                + linkBounds.left
                - navigationBounds.left
                - (navigationElement.clientWidth - linkBounds.width) / 2;

            navigationElement.scrollTo({
                left: centeredScrollPosition,
                behavior: useSmoothScroll && !reducedMotion.matches
                    ? "smooth"
                    : "auto"
            });
        }

        function setActiveNavigationLink(activeLink, useSmoothScroll) {
            const nextSectionId = activeLink.hash.slice(1);
            const hasActiveSectionChanged = nextSectionId !== activeSectionId;

            for (const link of navigationLinks) {
                if (link === activeLink) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            }

            if (hasActiveSectionChanged) {
                const focusedLink = navigationElement.querySelector("a:focus-visible");
                revealActiveNavigationLink(focusedLink ?? activeLink, useSmoothScroll);
                activeSectionId = nextSectionId;
            }
        }

        function finishRequestedNavigation() {
            clearTimeout(navigationSettleTimeoutId);
            requestedSectionId = null;
            activeSectionId = null;
            scheduleNavigationUpdate();
        }

        function cancelRequestedNavigation() {
            if (!requestedSectionId) return;
            finishRequestedNavigation();
        }

        function scheduleRequestedNavigationFinish(delay = 160) {
            clearTimeout(navigationSettleTimeoutId);
            navigationSettleTimeoutId = setTimeout(
                finishRequestedNavigation,
                delay
            );
        }

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

            if (requestedSectionId) {
                activeSection = sections.find(
                    section => section.id === requestedSectionId
                ) ?? activeSection;
            }

            const activeLink = [...navigationLinks].find(
                link => link.hash === `#${activeSection.id}`
            );

            if (activeLink) {
                setActiveNavigationLink(activeLink, activeSectionId !== null);
            }
        }

        function scheduleNavigationUpdate() {
            if (updateScheduled) return;
            updateScheduled = true;
            requestAnimationFrame(updateCurrentSection);
        }

        for (const link of navigationLinks) {
            link.addEventListener("focus", () => {
                if (link.matches(":focus-visible")) revealActiveNavigationLink(link, false);
            });
            link.addEventListener("click", () => {
                requestedSectionId = link.hash.slice(1);
                setActiveNavigationLink(link, true);
                scheduleRequestedNavigationFinish(350);
            });
        }

        addEventListener("scroll", () => {
            if (requestedSectionId) scheduleRequestedNavigationFinish();
            scheduleNavigationUpdate();
        }, { passive: true });
        addEventListener("wheel", cancelRequestedNavigation, { passive: true });
        addEventListener("touchstart", cancelRequestedNavigation, { passive: true });
        addEventListener("pointerdown", cancelRequestedNavigation, { passive: true });
        addEventListener("keydown", event => {
            if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
                cancelRequestedNavigation();
            }
        });
        addEventListener("resize", () => {
            activeSectionId = null;
            scheduleNavigationUpdate();
        });
        addEventListener("load", scheduleNavigationUpdate, { once: true });
        document.addEventListener("languagechange", () => {
            activeSectionId = null;
            scheduleNavigationUpdate();
        });
        scheduleNavigationUpdate();
    }
})();
