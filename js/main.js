/* ═══════════════════════════════════════════════════════
   INTRINSE — Main JavaScript
   Scroll reveals, cart, navigation, interactions
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Scroll Reveal ──
    const revealElements = document.querySelectorAll('.reveal-up');

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealElements.forEach((el, i) => {
        el.style.transitionDelay = `${i % 4 * 0.1}s`;
        revealObserver.observe(el);
    });

    // ── Navigation scroll state ──
    const nav = document.getElementById('nav');
    if (nav) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 80) {
                nav.classList.add('nav--scrolled');
            } else {
                nav.classList.remove('nav--scrolled');
            }
            lastScroll = scrollY;
        }, { passive: true });
    }

    // ── Cart System ──
    const cart = {
        items: [],

        init() {
            const stored = localStorage.getItem('intrinse-cart');
            if (stored) {
                try {
                    this.items = JSON.parse(stored);
                } catch (e) {
                    this.items = [];
                }
            }
            this.bindEvents();
            this.render();
        },

        bindEvents() {
            const toggle = document.getElementById('cart-toggle');
            const close = document.getElementById('cart-close');
            const overlay = document.getElementById('cart-overlay');
            const sidebar = document.getElementById('cart-sidebar');

            if (toggle) {
                toggle.addEventListener('click', () => {
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }

            if (close) {
                close.addEventListener('click', () => this.closeSidebar());
            }

            if (overlay) {
                overlay.addEventListener('click', () => this.closeSidebar());
            }

            // Listen for add-to-cart events
            document.addEventListener('click', (e) => {
                const addBtn = e.target.closest('[data-add-to-cart]');
                if (addBtn) {
                    e.preventDefault();
                    const product = {
                        id: addBtn.dataset.productId || 'energy',
                        name: addBtn.dataset.productName || 'INTRINSE',
                        state: addBtn.dataset.productState || 'ENERGY',
                        price: parseFloat(addBtn.dataset.productPrice) || 44,
                        weight: addBtn.dataset.productWeight || '500 g',
                    };
                    this.addItem(product);
                    // Open cart sidebar
                    const sidebar = document.getElementById('cart-sidebar');
                    const overlayEl = document.getElementById('cart-overlay');
                    if (sidebar) sidebar.classList.add('active');
                    if (overlayEl) overlayEl.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });

            // Checkout button — redirect to Shopify checkout
            const checkout = document.getElementById('cart-checkout');
            if (checkout) {
                checkout.addEventListener('click', () => {
                    if (this.items.length === 0) return;
                    // Build Shopify cart URL with all items
                    const variantMap = { energy: '54898857640265' };
                    const lineItems = this.items
                        .map((item) => {
                            const variantId = variantMap[item.id];
                            return variantId ? `${variantId}:${item.qty}` : null;
                        })
                        .filter(Boolean)
                        .join(',');
                    if (lineItems) {
                        window.location.href = `https://intrinse.eu/cart/${lineItems}`;
                    }
                });
            }
        },

        closeSidebar() {
            const sidebar = document.getElementById('cart-sidebar');
            const overlay = document.getElementById('cart-overlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        },

        addItem(product) {
            const existing = this.items.find((item) => item.id === product.id);
            if (existing) {
                existing.qty += 1;
            } else {
                this.items.push({ ...product, qty: 1 });
            }
            this.save();
            this.render();
        },

        removeItem(id) {
            this.items = this.items.filter((item) => item.id !== id);
            this.save();
            this.render();
        },

        updateQty(id, delta) {
            const item = this.items.find((i) => i.id === id);
            if (item) {
                item.qty = Math.max(1, item.qty + delta);
            }
            this.save();
            this.render();
        },

        save() {
            localStorage.setItem('intrinse-cart', JSON.stringify(this.items));
        },

        getTotal() {
            return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
        },

        render() {
            const countEl = document.getElementById('cart-count');
            const itemsEl = document.getElementById('cart-items');
            const footerEl = document.getElementById('cart-footer');
            const totalEl = document.getElementById('cart-total-price');

            if (!countEl || !itemsEl) return;

            const totalItems = this.items.reduce((sum, i) => sum + i.qty, 0);

            if (totalItems > 0) {
                countEl.style.display = 'flex';
                countEl.textContent = totalItems;
            } else {
                countEl.style.display = 'none';
            }

            if (this.items.length === 0) {
                itemsEl.innerHTML = '<p class="cart__empty">Dein Warenkorb ist leer.</p>';
                if (footerEl) footerEl.style.display = 'none';
                return;
            }

            if (footerEl) footerEl.style.display = 'block';
            if (totalEl) totalEl.textContent = this.getTotal() + ' \u20AC';

            itemsEl.innerHTML = this.items
                .map(
                    (item) => `
                <div class="cart__item">
                    <div class="cart__item-image">
                        <span>I N T R I N S E</span>
                    </div>
                    <div class="cart__item-info">
                        <div class="cart__item-name">${item.name}</div>
                        <div class="cart__item-state">${item.state}</div>
                        <div class="cart__item-price">${item.price} \u20AC</div>
                        <div class="cart__item-qty">
                            <button onclick="window.__cart.updateQty('${item.id}', -1)">\u2212</button>
                            <span>${item.qty}</span>
                            <button onclick="window.__cart.updateQty('${item.id}', 1)">+</button>
                        </div>
                        <button class="cart__item-remove" onclick="window.__cart.removeItem('${item.id}')">Entfernen</button>
                    </div>
                </div>
            `
                )
                .join('');
        },
    };

    // Expose cart for inline handlers
    window.__cart = cart;
    cart.init();

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ── Choose Your State hover glow intensification ──
    const stateCards = document.querySelectorAll('.choose__state:not(.choose__state--coming-soon)');
    stateCards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.01)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });

    // ── Parallax glow effect on First State section ──
    const firstStateSection = document.getElementById('first-state');
    if (firstStateSection) {
        const glows = firstStateSection.querySelectorAll('.first-state__glow');
        window.addEventListener('mousemove', (e) => {
            const rect = firstStateSection.getBoundingClientRect();
            if (rect.top > window.innerHeight || rect.bottom < 0) return;

            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            glows.forEach((glow, i) => {
                const factor = (i + 1) * 0.5;
                glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        }, { passive: true });
    }

    // ── Page enter animation ──
    document.body.classList.add('page-enter');
})();
