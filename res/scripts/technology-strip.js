// The source list is the only accessible list; its visual copy closes the loop.
(() => {
    const strip = document.querySelector("[data-technology-strip]");
    if (!strip) return;

    const viewport = strip.querySelector(".technology-strip-viewport");
    const track = strip.querySelector(".technology-strip-track");
    const sourceList = track.querySelector(".technology-list");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const desktopPointer = matchMedia("(min-width: 761px) and (hover: hover) and (pointer: fine)");

    let pointerInside = false;
    let hasFocus = false;
    let isVisible = !("IntersectionObserver" in window);

    function synchronizePlayback() {
        strip.classList.toggle("is-paused",
            pointerInside || hasFocus || !isVisible || document.hidden
        );
    }

    function refreshVisualCopy() {
        track.querySelector(".technology-list--copy")?.remove();
        const copy = sourceList.cloneNode(true);
        copy.classList.add("technology-list--copy");
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("inert", "");
        for (const element of [copy, ...copy.querySelectorAll("*")]) {
            element.removeAttribute("id");
            element.removeAttribute("data-i18n");
        }
        for (const image of copy.querySelectorAll("img")) {
            image.loading = "eager";
        }
        track.append(copy);
    }

    function synchronizeMode() {
        const mode = reducedMotion.matches ? "static"
            : desktopPointer.matches ? "animated" : "manual";
        if (strip.dataset.mode !== mode) {
            strip.dataset.mode = mode;
            viewport.scrollLeft = 0;
        }
        if (mode === "static") viewport.removeAttribute("tabindex");
        else viewport.setAttribute("tabindex", "0");
        synchronizePlayback();
    }

    viewport.addEventListener("pointerenter", () => {
        pointerInside = true;
        synchronizePlayback();
    });
    viewport.addEventListener("pointerleave", () => {
        pointerInside = false;
        synchronizePlayback();
    });
    viewport.addEventListener("focusin", () => {
        hasFocus = true;
        synchronizePlayback();
    });
    viewport.addEventListener("focusout", event => {
        hasFocus = viewport.contains(event.relatedTarget);
        synchronizePlayback();
    });
    document.addEventListener("visibilitychange", synchronizePlayback);
    document.addEventListener("languagechange", refreshVisualCopy);
    reducedMotion.addEventListener("change", synchronizeMode);
    desktopPointer.addEventListener("change", synchronizeMode);

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            isVisible = entries[0].isIntersecting;
            synchronizePlayback();
        }, { threshold: 0 });
        observer.observe(viewport);
    }

    refreshVisualCopy();
    synchronizeMode();
})();
