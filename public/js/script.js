function openImagePopup(imageSrc) {
    const popup = document.getElementById('image-popup');
    const popupImg = document.getElementById('popup-img');
    const popupContent = document.querySelector('.popup-content');
    popup.style.display = 'block';
    popupImg.src = imageSrc;
    popupImg.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const popup = document.getElementById('image-popup');
    const popupImg = document.getElementById('popup-img');
    popup.style.display = 'none';
    popupImg.classList.remove('active');
    document.body.style.overflow = '';
}

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Função para verificar se a seção está visível na viewport
    function isSectionInView(section) {
        const rect = section.getBoundingClientRect();
        return (
            rect.top <= window.innerHeight * 0.7 &&
            rect.bottom >= window.innerHeight * 0.3
        );
    }

    // Ativa projetos ao chegar na seção no mobile
    if (window.innerWidth <= 768) {
        const projetosSection = document.querySelector('#projetos');
        const projectItems = document.querySelectorAll('.project-item');
        let projetosAtivados = false;
        function ativarProjetosMobile() {
            if (!projetosAtivados && projetosSection && isSectionInView(projetosSection)) {
                projectItems.forEach((project, index) => {
                    project.classList.add('ativo');
                    project.style.opacity = '1';
                    project.style.transform = 'translateY(0)';
                });
                projetosAtivados = true;
            }
        }
        window.addEventListener('scroll', ativarProjetosMobile);
        // Também tenta ativar ao carregar
        ativarProjetosMobile();
    }
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });

    initializeSmoothScroll();
    document.getElementById('current-year').textContent = new Date().getFullYear();

    document.querySelectorAll('.card').forEach(card => {
        const btn = card.querySelector('.btn');
        if (btn) {
            btn.addEventListener('mouseenter', () => card.classList.add('button-hover'));
            btn.addEventListener('mouseleave', () => card.classList.remove('button-hover'));
            btn.addEventListener('click', e => {
                e.stopPropagation();
                if (e.currentTarget.href) {
                    window.open(e.currentTarget.href, '_blank');
                }
            });
        }
    });

    document.querySelectorAll('.card').forEach(card => {
        const btn = card.querySelector('.btn');
        if (btn) {
            btn.addEventListener('mouseenter', () => {
                card.classList.add('button-hover');
            });

            btn.addEventListener('mouseleave', () => {
                card.classList.remove('button-hover');
            });

            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (this.href) {
                    window.open(this.href, '_blank');
                }
            });
        }
    });

    // Ajuste para IntersectionObserver em telas menores
    function getObserverOptions() {
        if (window.innerWidth <= 768) {
            return { threshold: 0.05, rootMargin: '0px 0px -50px 0px' };
        }
        return { threshold: 0.1, rootMargin: '0px 0px -150px 0px' };
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('ativo');
                if (entry.target.getAttribute('data-scroll') === 'sequencia') {
                    const index = Array.from(entry.target.parentElement.children).indexOf(entry.target);
                    entry.target.style.setProperty('--scroll-order', index);
                }
                observer.unobserve(entry.target);
            }
        });
    }, getObserverOptions());

    document.querySelectorAll('[data-scroll], [data-scroll-section]').forEach(el => observer.observe(el));

    // Fallback para mobile: se não houver animação após 1s, força ativação
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            document.querySelectorAll('[data-scroll], [data-scroll-section]').forEach(el => {
                if (!el.classList.contains('ativo')) {
                    el.classList.add('ativo');
                }
            });
        }, 1000);
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');
    const projectsContainer = document.querySelector('#projetos .row');

    if (filterButtons.length && projectItems.length && projectsContainer) {
        function animateProjectSequentially(project, index) {
            project.style.opacity = '0';
            project.style.transform = 'translateY(20px)';
            project.classList.remove('wave-animate');
            
            setTimeout(() => {
                project.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                project.style.opacity = '1';
                project.style.transform = 'translateY(0)';
                project.classList.add('wave-animate');
            }, index * 150);
        }

        function filterProjects(filter) {
            const projects = Array.from(projectItems);
            
            projects.sort((a, b) => {
                if (filter === 'date') {
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                }
                return parseInt(a.dataset.relevance) - parseInt(b.dataset.relevance);
            });

            projects.forEach(project => {
                project.style.opacity = '0';
                project.style.transform = 'translateY(20px)';
            });

            setTimeout(() => {
                projectsContainer.innerHTML = '';
                projects.forEach((project, index) => {
                    projectsContainer.appendChild(project);
                    animateProjectSequentially(project, index);
                });
            }, 300);
        }

        const projectsSection = document.querySelector('#projetos');
        if (projectsSection) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    const projects = Array.from(projectItems);
                    projects.forEach((project, index) => {
                        animateProjectSequentially(project, index);
                    });
                    observer.unobserve(projectsSection);
                }
            }, { threshold: 0.1 });

            observer.observe(projectsSection);
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterProjects(button.dataset.filter);
            });
        });

        filterButtons[0]?.classList.add('active');
    }

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const popup = document.getElementById('image-popup');
    const popupImg = document.getElementById('popup-img');
    const closeBtn = document.querySelector('.close-popup');

    document.querySelectorAll('.image-container').forEach(container => {
        container.addEventListener('click', function(e) {
            const img = this.querySelector('.card-img-top');
            if (img) {
                e.stopPropagation();
                e.preventDefault();
                openImagePopup(img.src);
            }
        }, true);
    });

    closeBtn.addEventListener('click', closeModal);

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.style.display === 'block') {
            closeModal();
        }
    });
});