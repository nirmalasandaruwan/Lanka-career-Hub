(function () {
  'use strict';

  /* ─── Particle Network Canvas ─── */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animId;
    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 14000), 80);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const light = isLight();
      const dotColor = light ? 'rgba(10, 22, 40, 0.35)' : 'rgba(255, 255, 255, 0.5)';
      const lineColor = light ? 'rgba(212, 160, 23, 0.12)' : 'rgba(212, 160, 23, 0.15)';
      const mouseLineColor = light ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.25)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const glow = 0.6 + Math.sin(p.pulse) * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * glow, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.8 * (1 - dist / 130);
            ctx.stroke();
          }
        }

        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = mouseLineColor;
          ctx.lineWidth = 0.6 * (1 - mdist / 180);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    return () => cancelAnimationFrame(animId);
  }

  /* ─── Button Ripple Effect ─── */
  function initButtonRipples() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-gold, .btn-outline, .page-btn, .work-type-pill');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--ripple-x', x + '%');
      btn.style.setProperty('--ripple-y', y + '%');

      if (btn.classList.contains('btn-gold')) {
        btn.classList.add('ripple');
        setTimeout(() => btn.classList.remove('ripple'), 600);
      }

      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  /* ─── Parallax Orbs on Mouse ─── */
  function initOrbParallax() {
    const wraps = document.querySelectorAll('.orb-wrap');
    if (!wraps.length) return;

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      wraps.forEach((wrap, i) => {
        const factor = (i + 1) * 12;
        wrap.style.transform = `translate(${currentX * factor}px, ${currentY * factor}px)`;
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ─── Stagger children on scroll ─── */
  function initStaggerObserver() {
    const grids = document.querySelectorAll('#category-grid, #district-grid, #latest-jobs, #jobs-grid');
    grids.forEach(grid => {
      const observer = new MutationObserver(() => {
        grid.querySelectorAll('.fade-up, .category-chip, .glass-card').forEach((el, i) => {
          if (!el.style.transitionDelay) {
            el.style.transitionDelay = `${(i % 12) * 0.06}s`;
          }
        });
      });
      observer.observe(grid, { childList: true });
    });
  }

  /* ─── Counter bounce when visible ─── */
  function initStatCounters() {
    const stats = document.querySelectorAll('.stat-card');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'none';
          entry.target.offsetHeight;
          entry.target.style.animation = '';
          entry.target.classList.add('stat-bounce');
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(s => observer.observe(s));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initButtonRipples();
    initOrbParallax();
    initStaggerObserver();
    initStatCounters();
  });
})();
