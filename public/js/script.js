// ===== Image popup (course thumbnails) =====
function openImagePopup(src) {
    const popup = document.getElementById('image-popup');
    const img = document.getElementById('popup-img');
    popup.style.display = 'block';
    img.src = src;
    img.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const popup = document.getElementById('image-popup');
    const img = document.getElementById('popup-img');
    popup.style.display = 'none';
    img.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Current year in footer
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Smooth scroll for in-page anchors (CSS scroll-padding-top offsets the sticky nav)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===== Harmonic reveal =====================================================
    // One motion language (blur -> focus + slight rise + scale). The stagger is
    // applied ONLY between elements that enter together, ordered by their on-screen
    // position — so the order always reads top -> bottom, and an element that scrolls
    // in on its own appears immediately instead of waiting on a DOM-index delay.
    function byScreenPosition(a, b) {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
    }

    function revealBatch(elements, cls) {
        elements.sort(byScreenPosition);
        elements.forEach((el, i) => {
            el.style.transitionDelay = prefersReduced ? '0ms' : Math.min(i, 6) * 70 + 'ms';
            el.classList.add(cls);
        });
    }

    function makeRevealObserver(cls) {
        return new IntersectionObserver((entries, obs) => {
            const shown = [];
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    shown.push(entry.target);
                    obs.unobserve(entry.target);
                }
            });
            if (shown.length) revealBatch(shown, cls);
        }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });
    }

    const supportsIO = 'IntersectionObserver' in window;

    // General content
    const revealEls = Array.from(document.querySelectorAll('[data-aos]'));
    if (supportsIO) {
        const io = makeRevealObserver('revealed');
        revealEls.forEach(el => io.observe(el));
        // Fallback: reveal only in-view stragglers the observer may have missed
        setTimeout(() => {
            const missed = revealEls.filter(el =>
                !el.classList.contains('revealed') && el.getBoundingClientRect().top < window.innerHeight);
            if (missed.length) revealBatch(missed, 'revealed');
        }, 900);
    } else {
        revealEls.forEach(el => el.classList.add('revealed'));
    }

    // ===== Projects: each card revealed on entry; re-animated on sort ==========
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = Array.from(document.querySelectorAll('.project-item'));
    const projectsRow = document.querySelector('#projetos .row');

    if (filterButtons.length && projectItems.length && projectsRow) {
        if (supportsIO) {
            const pio = makeRevealObserver('reveal-in');
            projectItems.forEach(p => pio.observe(p));
            setTimeout(() => {
                const missed = projectItems.filter(p =>
                    !p.classList.contains('reveal-in') && p.getBoundingClientRect().top < window.innerHeight);
                if (missed.length) revealBatch(missed, 'reveal-in');
            }, 1000);
        } else {
            projectItems.forEach(p => p.classList.add('reveal-in'));
        }

        function sortProjects(filter) {
            const ordered = projectItems.slice().sort((a, b) =>
                filter === 'date'
                    ? new Date(b.dataset.date) - new Date(a.dataset.date)
                    : parseInt(a.dataset.relevance) - parseInt(b.dataset.relevance)
            );
            ordered.forEach(p => p.classList.remove('reveal-in'));
            setTimeout(() => {
                projectsRow.innerHTML = '';
                ordered.forEach((p, i) => {
                    projectsRow.appendChild(p);
                    void p.offsetWidth; // restart the transition
                    p.style.transitionDelay = prefersReduced ? '0ms' : Math.min(i, 8) * 70 + 'ms';
                    p.classList.add('reveal-in');
                });
            }, 250);
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                sortProjects(button.dataset.filter);
            });
        });
        filterButtons[0]?.classList.add('active');
    }

    // ===== Course image popup =================================================
    const popup = document.getElementById('image-popup');
    document.querySelectorAll('.image-container').forEach(container => {
        container.addEventListener('click', e => {
            const img = container.querySelector('.card-img-top');
            if (img) {
                e.stopPropagation();
                e.preventDefault();
                openImagePopup(img.src);
            }
        }, true);
    });
    document.querySelector('.close-popup')?.addEventListener('click', closeModal);
    popup?.addEventListener('click', e => {
        if (e.target === popup) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && popup?.style.display === 'block') closeModal();
    });

    // ===== Reading-progress bar + glass navbar state (rAF-throttled) ==========
    const progressBar = document.querySelector('.scroll-progress');
    const glassNav = document.querySelector('.glass-nav');
    let ticking = false;

    function onScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (progressBar) progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
        if (glassNav) glassNav.classList.toggle('scrolled', scrollTop > 20);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    onScroll();
});
