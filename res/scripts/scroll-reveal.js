if ("IntersectionObserver" in window) {
    const scrollRevealElements = document.querySelectorAll([
        ".sidebar-section:not(.about-section)",
        ".section-heading",
        ".project-grid",
        ".timeline-entry"
    ].join(", "));

    const scrollRevealObserver = new IntersectionObserver((observedEntries, observer) => {
        for (const observedEntry of observedEntries) {
            if (!observedEntry.isIntersecting) {
                continue;
            }

            observedEntry.target.classList.add("scroll-reveal--visible");
            observer.unobserve(observedEntry.target);
        }
    }, {
        rootMargin: "0px 0px -8%",
        threshold: 0.08
    });

    for (const scrollRevealElement of scrollRevealElements) {
        scrollRevealElement.classList.add("scroll-reveal");
    }

    document.documentElement.classList.add("scroll-reveal-enabled");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            for (const scrollRevealElement of scrollRevealElements) {
                if (
                    scrollRevealElement.getBoundingClientRect().top
                    < window.innerHeight * 0.92
                ) {
                    scrollRevealElement.classList.add("scroll-reveal--visible");
                }
                else {
                    scrollRevealObserver.observe(scrollRevealElement);
                }
            }
        });
    });
}
