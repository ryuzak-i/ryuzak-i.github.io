if ("IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll([
        ".intro-section:not(.about)",
        ".detail-title",
        ".project-grid",
        ".timeline-block"
    ].join(", "));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) {
                continue;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        }
    }, {
        rootMargin: "0px 0px -8%",
        threshold: 0.08
    });

    for (const target of revealTargets) {
        target.classList.add("reveal-target");
    }

    document.documentElement.classList.add("reveal-enabled");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            for (const target of revealTargets) {
                if (target.getBoundingClientRect().top < window.innerHeight * 0.92) {
                    target.classList.add("is-visible");
                }
                else {
                    revealObserver.observe(target);
                }
            }
        });
    });
}
