/**
 * Custom JavaScript for Personal Blog
 * 自定义交互效果
 */

(function() {
  'use strict';

  /**
   * 初始化函数
   */
  function init() {
    handleNavbarScroll();
    handleSmoothScroll();
    handleCardAnimations();
    handleImageLazyLoading();
  }

  /**
   * 导航栏滚动效果
   * 滚动时改变导航栏背景透明度
   */
  function handleNavbarScroll() {
    const navbar = document.querySelector('header');
    if (!navbar) return;

    let lastScrollTop = 0;
    let ticking = false;

    window.addEventListener('scroll', function() {
      lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateNavbar(lastScrollTop);
          ticking = false;
        });
        ticking = true;
      }
    });

    function updateNavbar(scrollTop) {
      if (scrollTop > 50) {
        navbar.style.background = 'rgba(52, 73, 94, 0.98)';
        navbar.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.2)';
      } else {
        navbar.style.background = 'rgba(52, 73, 94, 0.9)';
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }
    }
  }

  /**
   * 平滑滚动
   * 点击锚点链接时平滑滚动
   */
  function handleSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * 文章卡片动画
   * 滚动到视图时添加动画效果
   */
  function handleCardAnimations() {
    const cards = document.querySelectorAll('.article-card');
    if (cards.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';

          setTimeout(() => {
            entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);

          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.1}s`;
      observer.observe(card);
    });
  }

  /**
   * 图片懒加载
   * 优化图片加载性能
   */
  function handleImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;

    const imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * 返回顶部按钮
   */
  function createBackToTop() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', '返回顶部');
    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(52, 116, 187, 0.9);
      color: white;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    });

    button.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    button.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.background = 'rgba(52, 116, 187, 1)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.background = 'rgba(52, 116, 187, 0.9)';
    });
  }

  /**
   * 搜索功能增强
   */
  function enhanceSearch() {
    const searchInput = document.querySelector('input[type="search"]');
    if (!searchInput) return;

    searchInput.addEventListener('focus', function() {
      this.parentElement.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.3)';
    });

    searchInput.addEventListener('blur', function() {
      this.parentElement.style.boxShadow = 'none';
    });
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 创建返回顶部按钮
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBackToTop);
  } else {
    createBackToTop();
  }

  // 搜索功能增强
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceSearch);
  } else {
    enhanceSearch();
  }

})();
