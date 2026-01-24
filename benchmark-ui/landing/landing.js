// Smooth scroll for anchor links (fallback for older browsers)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for fade-in animations on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections for animation
document.querySelectorAll('.comparison-card, .metric-detail, .tech-item, .setup-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Copy to clipboard for code blocks
document.querySelectorAll('.code-block').forEach(block => {
    block.style.cursor = 'pointer';
    block.title = 'Click to copy';

    block.addEventListener('click', async () => {
        const code = block.querySelector('code').textContent;
        try {
            await navigator.clipboard.writeText(code);
            const originalText = block.querySelector('code').textContent;
            block.querySelector('code').textContent = 'Copied!';
            setTimeout(() => {
                block.querySelector('code').textContent = originalText;
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });
});

// Active nav link highlighting
const sections = document.querySelectorAll('section[id], header[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.style.color = '';
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.style.color = 'var(--color-teal)';
                }
            });
        }
    });
});
