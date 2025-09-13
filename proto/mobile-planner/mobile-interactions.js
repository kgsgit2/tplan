/**
 * Mobile Travel Planner - Interaction Handler
 * Optimized for performance and accessibility
 * Supports touch gestures, drag & drop, and smooth animations
 */

class MobilePlanner {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.currentTab = 0;
        this.draggedElement = null;
        this.touchThreshold = 10;
        this.swipeThreshold = 50;
        this.animationFrame = null;
        this.hapticFeedback = 'vibrate' in navigator;
        this.pointerCache = [];
        this.isDragging = false;
        this.dragGhost = null;
        this.scrollLock = false;
        this.touchVelocity = { x: 0, y: 0 };
        this.lastTouchTime = 0;
        this.lastTouchPos = { x: 0, y: 0 };
        
        // Performance monitoring
        this.performanceObserver = null;
        this.interactionMetrics = {
            fps: 60,
            inputLatency: 0,
            scrollPerformance: 100
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        this.setupServiceWorker();
        this.restoreScrollPosition();
        this.initializeDarkMode();
        this.prefetchContent();
    }

    // ===========================================
    // Event Listeners Setup
    // ===========================================
    
    setupEventListeners() {
        // Passive event listeners for better scroll performance
        const passiveOptions = { passive: true, capture: false };
        const activeOptions = { passive: false, capture: false };
        
        // Tab Navigation
        this.setupTabNavigation();
        
        // Drag and Drop for Plan Cards
        this.setupDragAndDrop();
        
        // Bottom Navigation
        this.setupBottomNavigation();
        
        // Filter Pills
        this.setupFilterPills();
        
        // FAB and Modal
        this.setupFAB();
        
        // Pull to Refresh
        this.setupPullToRefresh();
        
        // Touch Gestures
        this.setupTouchGestures();
        
        // Form Interactions
        this.setupFormInteractions();
        
        // Keyboard Navigation
        this.setupKeyboardNavigation();
        
        // Theme Toggle
        this.setupThemeToggle();
        
        // Search
        this.setupSearch();
        
        // Sidebar Toggle
        this.setupSidebar();
        
        // Optimize scroll performance
        let scrollTimeout;
        document.querySelector('.main-content').addEventListener('scroll', (e) => {
            if (!scrollTimeout) {
                window.requestAnimationFrame(() => {
                    this.saveScrollPosition();
                    scrollTimeout = null;
                });
            }
            scrollTimeout = setTimeout(() => scrollTimeout = null, 100);
        }, passiveOptions);
    }

    // ===========================================
    // Tab Navigation with Swipe Support
    // ===========================================
    
    setupTabNavigation() {
        const tabContainer = document.getElementById('dayTabs');
        const tabs = tabContainer.querySelectorAll('.tab-button');
        let startX = 0;
        let scrollLeft = 0;
        let isDown = false;
        
        // Click handling
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                this.switchTab(index);
                this.provideHapticFeedback('light');
            });
        });
        
        // Swipe handling for tab container
        tabContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - tabContainer.offsetLeft;
            scrollLeft = tabContainer.scrollLeft;
        }, { passive: true });
        
        tabContainer.addEventListener('touchmove', (e) => {
            if (!startX) return;
            const x = e.touches[0].pageX - tabContainer.offsetLeft;
            const walk = (startX - x) * 2;
            tabContainer.scrollLeft = scrollLeft + walk;
        }, { passive: true });
        
        // Keyboard support
        tabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.switchTab(index);
                }
                if (e.key === 'ArrowRight' && index < tabs.length - 1) {
                    tabs[index + 1].focus();
                }
                if (e.key === 'ArrowLeft' && index > 0) {
                    tabs[index - 1].focus();
                }
            });
        });
    }
    
    switchTab(index) {
        const tabs = document.querySelectorAll('.tab-button');
        const currentActive = document.querySelector('.tab-button.active');
        
        if (currentActive) {
            currentActive.classList.remove('active');
            currentActive.setAttribute('aria-selected', 'false');
        }
        
        tabs[index].classList.add('active');
        tabs[index].setAttribute('aria-selected', 'true');
        
        // Smooth scroll to tab
        tabs[index].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
        });
        
        // Load content for the selected day
        this.loadDayContent(index);
        
        // Update URL without page reload
        history.pushState({ tab: index }, '', `#day${index + 1}`);
    }

    // ===========================================
    // Drag and Drop Implementation
    // ===========================================
    
    setupDragAndDrop() {
        const planCards = document.querySelectorAll('.plan-card');
        
        planCards.forEach(card => {
            // Use Pointer Events for unified touch/mouse handling
            card.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            card.addEventListener('pointermove', this.handlePointerMove.bind(this));
            card.addEventListener('pointerup', this.handlePointerUp.bind(this));
            card.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
            
            // Prevent default drag behavior
            card.addEventListener('dragstart', (e) => e.preventDefault());
            
            // Add touch-action CSS for better performance
            card.style.touchAction = 'none';
            
            // Add will-change for GPU acceleration
            card.style.willChange = 'transform';
        });
        
        // Setup drop zones with Intersection Observer for better performance
        this.setupDropZones();
    }
    
    handlePointerDown(e) {
        // Store pointer info
        this.pointerCache.push(e);
        
        const card = e.currentTarget;
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.lastTouchPos = { x: e.clientX, y: e.clientY };
        this.lastTouchTime = performance.now();
        
        // Set pointer capture for consistent events
        card.setPointerCapture(e.pointerId);
        
        // Long press detection with visual feedback
        this.dragTimeout = setTimeout(() => {
            if (!this.isDragging && this.pointerCache.length === 1) {
                this.startDragWithAnimation(card, e);
            }
        }, 200); // Reduced from 300ms for better responsiveness
        
        // Add press visual feedback
        card.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'scale(0.98)';
    }
    
    handlePointerMove(e) {
        // Update pointer cache
        const index = this.pointerCache.findIndex(p => p.pointerId === e.pointerId);
        if (index > -1) {
            this.pointerCache[index] = e;
        }
        
        // Calculate velocity for momentum
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTouchTime;
        if (deltaTime > 0) {
            this.touchVelocity.x = (e.clientX - this.lastTouchPos.x) / deltaTime;
            this.touchVelocity.y = (e.clientY - this.lastTouchPos.y) / deltaTime;
        }
        this.lastTouchPos = { x: e.clientX, y: e.clientY };
        this.lastTouchTime = currentTime;
        
        const deltaX = Math.abs(e.clientX - this.touchStartX);
        const deltaY = Math.abs(e.clientY - this.touchStartY);
        
        // Cancel long press if moved too much
        if ((deltaX > this.touchThreshold || deltaY > this.touchThreshold) && !this.isDragging) {
            clearTimeout(this.dragTimeout);
            const card = e.currentTarget;
            card.style.transform = '';
        }
        
        // Handle dragging with requestAnimationFrame for smooth 60fps
        if (this.isDragging && this.dragGhost) {
            e.preventDefault();
            
            if (!this.animationFrame) {
                this.animationFrame = requestAnimationFrame(() => {
                    this.updateDragPosition(e.clientX, e.clientY);
                    this.checkDropZone(e.clientX, e.clientY);
                    this.animationFrame = null;
                });
            }
        }
    }
    
    handlePointerUp(e) {
        clearTimeout(this.dragTimeout);
        
        // Remove from cache
        this.pointerCache = this.pointerCache.filter(p => p.pointerId !== e.pointerId);
        
        const card = e.currentTarget;
        card.releasePointerCapture(e.pointerId);
        card.style.transform = '';
        
        if (this.isDragging && this.dragGhost) {
            this.endDragWithAnimation();
        }
        
        // Reset states
        this.isDragging = false;
        this.scrollLock = false;
    }
    
    handlePointerCancel(e) {
        this.handlePointerUp(e);
    }
    
    handleDragStart(e) {
        this.draggedElement = e.target;
        this.startDrag(e.target);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }
    
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (this.draggedElement !== e.target) {
            const container = document.querySelector('.timeline-container');
            const allCards = [...container.querySelectorAll('.plan-card')];
            const draggedIndex = allCards.indexOf(this.draggedElement);
            const targetIndex = allCards.indexOf(e.target.closest('.plan-card'));
            
            if (draggedIndex < targetIndex) {
                e.target.closest('.plan-card').after(this.draggedElement);
            } else {
                e.target.closest('.plan-card').before(this.draggedElement);
            }
        }
        
        return false;
    }
    
    handleDragEnd(e) {
        this.endDrag(e.target);
    }
    
    startDragWithAnimation(element, event) {
        this.isDragging = true;
        this.draggedElement = element;
        
        // Create ghost element for dragging
        this.dragGhost = element.cloneNode(true);
        this.dragGhost.classList.add('drag-ghost');
        this.dragGhost.style.position = 'fixed';
        this.dragGhost.style.zIndex = '1000';
        this.dragGhost.style.pointerEvents = 'none';
        this.dragGhost.style.width = element.offsetWidth + 'px';
        this.dragGhost.style.transform = 'scale(1.05) rotate(2deg)';
        this.dragGhost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        this.dragGhost.style.opacity = '0.9';
        
        // Position ghost at current location
        const rect = element.getBoundingClientRect();
        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        this.dragGhost.style.left = (rect.left) + 'px';
        this.dragGhost.style.top = (rect.top) + 'px';
        
        document.body.appendChild(this.dragGhost);
        
        // Hide original element
        element.style.opacity = '0.3';
        element.classList.add('dragging-source');
        
        // Haptic feedback
        this.provideHapticFeedback('medium');
        
        // Lock scroll during drag
        this.scrollLock = true;
        document.body.style.overflow = 'hidden';
    }
    
    endDragWithAnimation() {
        if (!this.dragGhost || !this.draggedElement) return;
        
        // Get final position
        const dropTarget = this.getDropTarget(this.lastTouchPos.x, this.lastTouchPos.y);
        
        if (dropTarget && dropTarget !== this.draggedElement) {
            // Animate to new position
            const targetRect = dropTarget.getBoundingClientRect();
            this.dragGhost.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)';
            this.dragGhost.style.left = targetRect.left + 'px';
            this.dragGhost.style.top = targetRect.top + 'px';
            this.dragGhost.style.transform = 'scale(1) rotate(0deg)';
            
            // Reorder in DOM
            setTimeout(() => {
                const container = document.querySelector('.timeline-container');
                const afterElement = this.getDragAfterElement(this.lastTouchPos.y);
                
                if (afterElement == null) {
                    container.appendChild(this.draggedElement);
                } else {
                    container.insertBefore(this.draggedElement, afterElement);
                }
                
                this.cleanupDrag();
                this.savePlanOrder();
                this.showToast('일정 순서가 변경되었습니다');
                this.provideHapticFeedback('success');
            }, 200);
        } else {
            // Animate back to original position with spring effect
            const originalRect = this.draggedElement.getBoundingClientRect();
            this.dragGhost.style.transition = 'all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            this.dragGhost.style.left = originalRect.left + 'px';
            this.dragGhost.style.top = originalRect.top + 'px';
            this.dragGhost.style.transform = 'scale(1) rotate(0deg)';
            
            setTimeout(() => {
                this.cleanupDrag();
            }, 300);
        }
    }
    
    cleanupDrag() {
        if (this.dragGhost) {
            this.dragGhost.remove();
            this.dragGhost = null;
        }
        
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '';
            this.draggedElement.classList.remove('dragging-source');
            this.draggedElement = null;
        }
        
        // Remove drop zone highlights
        document.querySelectorAll('.drop-zone-active').forEach(el => {
            el.classList.remove('drop-zone-active');
        });
        
        // Restore scroll
        document.body.style.overflow = '';
    }
    
    updateDragPosition(x, y) {
        if (!this.dragGhost) return;
        
        this.dragGhost.style.left = (x - this.dragOffset.x) + 'px';
        this.dragGhost.style.top = (y - this.dragOffset.y) + 'px';
    }
    
    setupDropZones() {
        // Create invisible drop zones between cards for better UX
        const container = document.querySelector('.timeline-container');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible-drop-zone');
                } else {
                    entry.target.classList.remove('visible-drop-zone');
                }
            });
        }, { threshold: 0.1 });
        
        // Observe all plan cards for visibility
        document.querySelectorAll('.plan-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    checkDropZone(x, y) {
        const cards = document.querySelectorAll('.plan-card:not(.dragging-source)');
        let closestCard = null;
        let closestDistance = Infinity;
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const distance = Math.abs(y - centerY);
            
            if (distance < closestDistance && distance < 100) {
                closestDistance = distance;
                closestCard = card;
            }
        });
        
        // Highlight drop zone
        document.querySelectorAll('.drop-zone-active').forEach(el => {
            el.classList.remove('drop-zone-active');
        });
        
        if (closestCard) {
            closestCard.classList.add('drop-zone-active');
        }
    }
    
    getDropTarget(x, y) {
        return document.elementFromPoint(x, y)?.closest('.plan-card:not(.dragging-source)');
    }
    
    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.plan-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ===========================================
    // Bottom Navigation
    // ===========================================
    
    setupBottomNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    nav.removeAttribute('aria-current');
                });
                
                // Add active class to clicked item
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
                
                // Haptic feedback
                this.provideHapticFeedback('light');
                
                // Navigate to section
                this.navigateToSection(index);
            });
        });
    }
    
    navigateToSection(index) {
        const sections = ['timeline', 'map', 'saved', 'profile'];
        const section = sections[index];
        
        // Hide all sections
        document.querySelectorAll('.main-content > section').forEach(s => {
            s.hidden = true;
        });
        
        // Show selected section
        if (section === 'map') {
            document.querySelector('.map-section').hidden = false;
            this.initializeMap();
        } else {
            document.querySelector('.timeline-section').hidden = false;
        }
        
        // Update URL
        history.pushState({ section }, '', `#${section}`);
    }

    // ===========================================
    // Filter Pills
    // ===========================================
    
    setupFilterPills() {
        const pills = document.querySelectorAll('.filter-pill');
        
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                const isActive = pill.classList.contains('active');
                
                // If clicking "All", deactivate others
                if (pill.textContent.includes('전체')) {
                    pills.forEach(p => {
                        p.classList.remove('active');
                        p.setAttribute('aria-pressed', 'false');
                    });
                    pill.classList.add('active');
                    pill.setAttribute('aria-pressed', 'true');
                } else {
                    // Toggle individual filter
                    if (isActive) {
                        pill.classList.remove('active');
                        pill.setAttribute('aria-pressed', 'false');
                    } else {
                        pill.classList.add('active');
                        pill.setAttribute('aria-pressed', 'true');
                        // Remove "All" filter if selecting specific category
                        const allFilter = [...pills].find(p => p.textContent.includes('전체'));
                        if (allFilter) {
                            allFilter.classList.remove('active');
                            allFilter.setAttribute('aria-pressed', 'false');
                        }
                    }
                }
                
                this.provideHapticFeedback('light');
                this.filterPlans();
            });
        });
    }
    
    filterPlans() {
        const activePills = document.querySelectorAll('.filter-pill.active');
        const planCards = document.querySelectorAll('.plan-card');
        const activeCategories = new Set();
        
        activePills.forEach(pill => {
            if (pill.textContent.includes('전체')) {
                activeCategories.add('all');
            } else if (pill.textContent.includes('식당')) {
                activeCategories.add('restaurant');
            } else if (pill.textContent.includes('카페')) {
                activeCategories.add('cafe');
            } else if (pill.textContent.includes('관광')) {
                activeCategories.add('attraction');
            } else if (pill.textContent.includes('쇼핑')) {
                activeCategories.add('shopping');
            }
        });
        
        planCards.forEach(card => {
            const category = card.querySelector('.card-category').className.split(' ')[1];
            
            if (activeCategories.has('all') || activeCategories.has(category)) {
                card.style.display = '';
                card.style.animation = 'fadeIn 300ms ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ===========================================
    // FAB and Modal
    // ===========================================
    
    setupFAB() {
        const fab = document.querySelector('.fab');
        const modal = document.getElementById('addPlanModal');
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('.btn-secondary');
        const form = modal.querySelector('form');
        
        // Open modal
        fab.addEventListener('click', () => {
            this.openModal(modal, overlay);
        });
        
        // Close modal
        const closeModal = () => {
            this.closeModal(modal, overlay);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Handle sheet dragging
        this.setupBottomSheetDrag(modal);
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPlan(form);
            closeModal();
        });
        
        // Inline add buttons
        document.querySelectorAll('.add-plan-inline').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openModal(modal, overlay);
            });
        });
    }
    
    openModal(modal, overlay) {
        modal.hidden = false;
        overlay.hidden = false;
        
        // Force reflow
        modal.offsetHeight;
        
        requestAnimationFrame(() => {
            modal.classList.add('show');
            overlay.classList.add('show');
        });
        
        // Focus first input
        setTimeout(() => {
            modal.querySelector('input').focus();
        }, 300);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modal, overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        
        setTimeout(() => {
            modal.hidden = true;
            overlay.hidden = true;
            document.body.style.overflow = '';
        }, 300);
    }
    
    setupBottomSheetDrag(modal) {
        const handle = modal.querySelector('.sheet-handle');
        let startY = 0;
        let currentY = 0;
        let modalHeight = 0;
        
        const handleStart = (e) => {
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            modalHeight = modal.offsetHeight;
            modal.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!startY) return;
            
            currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0) {
                modal.style.transform = `translateY(${deltaY}px)`;
            }
        };
        
        const handleEnd = () => {
            modal.style.transition = '';
            
            const deltaY = currentY - startY;
            
            if (deltaY > modalHeight * 0.3) {
                this.closeModal(modal, document.getElementById('modalOverlay'));
            } else {
                modal.style.transform = '';
            }
            
            startY = 0;
            currentY = 0;
        };
        
        handle.addEventListener('touchstart', handleStart, { passive: true });
        handle.addEventListener('touchmove', handleMove, { passive: true });
        handle.addEventListener('touchend', handleEnd);
        
        handle.addEventListener('mousedown', handleStart);
        handle.addEventListener('mousemove', handleMove);
        handle.addEventListener('mouseup', handleEnd);
    }

    // ===========================================
    // Pull to Refresh
    // ===========================================
    
    setupPullToRefresh() {
        const mainContent = document.querySelector('.main-content');
        let startY = 0;
        let isPulling = false;
        
        mainContent.addEventListener('touchstart', (e) => {
            if (mainContent.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0 && deltaY < 150) {
                mainContent.style.transform = `translateY(${deltaY * 0.5}px)`;
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchend', (e) => {
            if (!isPulling) return;
            
            const endY = e.changedTouches[0].clientY;
            const deltaY = endY - startY;
            
            mainContent.style.transform = '';
            
            if (deltaY > 100) {
                this.refreshContent();
            }
            
            isPulling = false;
        });
    }
    
    refreshContent() {
        this.showToast('새로고침 중...');
        
        // Simulate content refresh
        setTimeout(() => {
            this.loadDayContent(this.currentTab);
            this.showToast('업데이트 완료');
            this.provideHapticFeedback('success');
        }, 1000);
    }

    // ===========================================
    // Touch Gestures
    // ===========================================
    
    setupTouchGestures() {
        const mainContent = document.querySelector('.main-content');
        let startX = 0;
        let startY = 0;
        
        mainContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        mainContent.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Horizontal swipe (switch days)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
                if (deltaX > 0 && this.currentTab > 0) {
                    // Swipe right - previous day
                    this.switchTab(this.currentTab - 1);
                } else if (deltaX < 0 && this.currentTab < 3) {
                    // Swipe left - next day
                    this.switchTab(this.currentTab + 1);
                }
            }
        }, { passive: true });
    }

    // ===========================================
    // Form Interactions
    // ===========================================
    
    setupFormInteractions() {
        // Category selection with ripple effect
        const categoryBtns = document.querySelectorAll('.category-btn');
        
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Add ripple effect
                this.createRipple(e, btn);
                
                categoryBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.provideHapticFeedback('selection');
                
                // Animate selection
                btn.style.animation = 'pulse 300ms ease-out';
                setTimeout(() => {
                    btn.style.animation = '';
                }, 300);
            });
        });
        
        // Time picker enhancement
        const timeInput = document.getElementById('time-select');
        if (timeInput) {
            timeInput.addEventListener('change', () => {
                this.validateTimeSlot(timeInput.value);
            });
        }
        
        // Search input
        const searchInput = document.getElementById('place-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchPlaces(e.target.value);
                }, 300);
            });
        }
    }

    // ===========================================
    // Keyboard Navigation
    // ===========================================
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    this.closeModal(modal, document.getElementById('modalOverlay'));
                }
            }
            
            // Tab navigation with arrow keys
            if (e.key === 'ArrowLeft' && e.ctrlKey) {
                if (this.currentTab > 0) {
                    this.switchTab(this.currentTab - 1);
                }
            }
            
            if (e.key === 'ArrowRight' && e.ctrlKey) {
                if (this.currentTab < 3) {
                    this.switchTab(this.currentTab + 1);
                }
            }
        });
    }

    // ===========================================
    // Theme Toggle
    // ===========================================
    
    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            const icon = themeToggle.querySelector('.material-icons-round');
            icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
            
            // Update theme color meta tag
            const themeColor = newTheme === 'dark' ? '#141218' : '#6750A4';
            document.querySelector('meta[name="theme-color"]').content = themeColor;
            
            this.provideHapticFeedback('light');
        });
    }
    
    setupSidebar() {
        const menuButton = document.getElementById('menuButton');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        // Toggle sidebar
        const toggleSidebar = () => {
            const isOpen = sidebar.classList.contains('open');
            
            if (isOpen) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
                menuButton.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('show');
                menuButton.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
            
            this.provideHapticFeedback('light');
        };
        
        // Menu button click
        menuButton.addEventListener('click', toggleSidebar);
        
        // Overlay click to close
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        // Sidebar item clicks
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Remove active from all items
                document.querySelectorAll('.sidebar-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // Add active to clicked item
                item.classList.add('active');
                
                // Close sidebar on mobile
                if (window.innerWidth < 768) {
                    setTimeout(() => {
                        sidebar.classList.remove('open');
                        sidebarOverlay.classList.remove('show');
                        menuButton.setAttribute('aria-expanded', 'false');
                        document.body.style.overflow = '';
                    }, 200);
                }
                
                this.provideHapticFeedback('light');
            });
        });
        
        // Swipe to open/close sidebar
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        const handleSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            const threshold = 50;
            
            // Swipe right from left edge to open
            if (touchStartX < 20 && swipeDistance > threshold && !sidebar.classList.contains('open')) {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('show');
                menuButton.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
                this.provideHapticFeedback('medium');
            }
            
            // Swipe left to close
            if (swipeDistance < -threshold && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
                menuButton.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                this.provideHapticFeedback('medium');
            }
        };
    }
    
    initializeDarkMode() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            const icon = document.querySelector('.theme-toggle .material-icons-round');
            if (icon) icon.textContent = 'light_mode';
            document.querySelector('meta[name="theme-color"]').content = '#141218';
        }
    }

    // ===========================================
    // Search
    // ===========================================
    
    setupSearch() {
        const searchBtn = document.querySelector('.header-actions .icon-button:first-child');
        
        searchBtn.addEventListener('click', () => {
            this.openSearchOverlay();
        });
    }
    
    openSearchOverlay() {
        // Create search overlay
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-header">
                <button class="icon-button back-button">
                    <span class="material-icons-round">arrow_back</span>
                </button>
                <input type="search" placeholder="장소, 일정 검색..." autofocus>
                <button class="icon-button clear-button">
                    <span class="material-icons-round">clear</span>
                </button>
            </div>
            <div class="search-results"></div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
        // Event handlers
        overlay.querySelector('.back-button').addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });
        
        overlay.querySelector('.clear-button').addEventListener('click', () => {
            overlay.querySelector('input').value = '';
            overlay.querySelector('input').focus();
        });
        
        let debounceTimer;
        overlay.querySelector('input').addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }

    // ===========================================
    // Intersection Observer for Lazy Loading
    // ===========================================
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadCardImages(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);
        
        // Observe all plan cards
        document.querySelectorAll('.plan-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    loadCardImages(card) {
        const imagePlaceholders = card.querySelectorAll('.image-placeholder');
        
        imagePlaceholders.forEach((placeholder, index) => {
            setTimeout(() => {
                placeholder.style.background = `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
                placeholder.style.animation = 'fadeIn 300ms ease-out';
            }, index * 100);
        });
    }

    // ===========================================
    // Performance Monitoring
    // ===========================================
    
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor Core Web Vitals
            this.setupCoreWebVitals();
            
            // Monitor First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.interactionMetrics.inputLatency = entry.processingStart - entry.startTime;
                        this.reportMetric('FID', this.interactionMetrics.inputLatency);
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.log('FID monitoring not supported');
            }
            
            // Monitor Interaction to Next Paint (INP)
            try {
                const inpObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 100) {
                            console.warn('Slow interaction detected:', entry.name, entry.duration + 'ms');
                        }
                    }
                });
                inpObserver.observe({ entryTypes: ['event'] });
            } catch (e) {
                console.log('INP monitoring not supported');
            }
            
            // Monitor frame rate
            let lastTime = performance.now();
            let frames = 0;
            let frameDrops = 0;
            
            const measureFPS = () => {
                frames++;
                const currentTime = performance.now();
                const delta = currentTime - lastTime;
                
                // Detect frame drops (> 16.67ms between frames)
                if (delta > 20) {
                    frameDrops++;
                }
                
                if (currentTime >= lastTime + 1000) {
                    this.interactionMetrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                    
                    // Report if FPS drops below 50
                    if (this.interactionMetrics.fps < 50) {
                        console.warn('Low FPS detected:', this.interactionMetrics.fps);
                    }
                    
                    frames = 0;
                    frameDrops = 0;
                    lastTime = currentTime;
                }
                
                requestAnimationFrame(measureFPS);
            };
            
            measureFPS();
        }
    }
    
    setupCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.reportMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.reportMetric('CLS', clsValue);
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.reportMetric('FCP', entry.startTime);
                }
            }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
    }
    
    reportMetric(metric, value) {
        // Send to analytics or display in console
        const status = this.getMetricStatus(metric, value);
        console.log(`[${metric}]: ${value.toFixed(2)}ms - ${status}`);
        
        // Store for later analysis
        if (!window.performanceMetrics) {
            window.performanceMetrics = {};
        }
        window.performanceMetrics[metric] = value;
    }
    
    getMetricStatus(metric, value) {
        const thresholds = {
            FCP: { good: 1000, needsImprovement: 3000 },
            LCP: { good: 2500, needsImprovement: 4000 },
            FID: { good: 100, needsImprovement: 300 },
            CLS: { good: 0.1, needsImprovement: 0.25 },
            INP: { good: 100, needsImprovement: 200 }
        };
        
        const threshold = thresholds[metric];
        if (!threshold) return 'N/A';
        
        if (value <= threshold.good) return '✅ Good';
        if (value <= threshold.needsImprovement) return '⚠️ Needs Improvement';
        return '❌ Poor';
    }

    // ===========================================
    // Service Worker for Offline Support
    // ===========================================
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Register service worker for offline support
            // navigator.serviceWorker.register('/sw.js');
        }
    }

    // ===========================================
    // Utility Functions
    // ===========================================
    
    provideHapticFeedback(intensity = 'light') {
        if (!this.hapticFeedback) return;
        
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30,
            success: [10, 30, 10, 30, 10],
            error: [50, 100, 50],
            warning: [30, 50, 30],
            selection: [5, 5],
            impact: 15,
            notification: [20, 100, 20]
        };
        
        const pattern = patterns[intensity] || 10;
        
        // Vibrate with pattern
        navigator.vibrate(pattern);
        
        // Add visual feedback for non-haptic devices
        if (!('vibrate' in navigator)) {
            this.provideVisualFeedback(intensity);
        }
    }
    
    provideVisualFeedback(type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `visual-feedback visual-feedback-${type}`;
        feedbackElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
        `;
        
        const animations = {
            success: 'pulse-success 600ms ease-out',
            error: 'shake 300ms ease-in-out',
            light: 'pulse-light 200ms ease-out'
        };
        
        feedbackElement.style.animation = animations[type] || animations.light;
        document.body.appendChild(feedbackElement);
        
        setTimeout(() => feedbackElement.remove(), 600);
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        
        // Remove previous type classes
        toast.className = 'toast';
        
        // Add type-specific class
        if (type !== 'info') {
            toast.classList.add(type);
        }
        
        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toastMessage.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span> ${message}`;
        toast.hidden = false;
        
        // Animate in with spring effect
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto-dismiss
        const dismissTimer = setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
        
        // Allow manual dismiss on tap
        toast.onclick = () => {
            clearTimeout(dismissTimer);
            this.dismissToast(toast);
        };
    }
    
    dismissToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.hidden = true;
            toast.onclick = null;
        }, 300);
    }
    
    loadDayContent(dayIndex) {
        this.currentTab = dayIndex;
        
        // Optimistic UI update
        const timeline = document.querySelector('.timeline-container');
        timeline.classList.add('optimistic-update');
        
        // Show skeleton loader for new content
        this.showSkeletonLoader();
        
        // Simulate content loading with progressive enhancement
        this.progressiveLoadContent().then(() => {
            timeline.classList.remove('optimistic-update');
            
            // Re-setup drag and drop for new content
            this.setupDragAndDrop();
            
            // Animate new content
            this.animateContentEntrance();
        });
    }
    
    showSkeletonLoader() {
        const container = document.querySelector('.timeline-container');
        const existingCards = container.querySelectorAll('.plan-card');
        
        // Keep existing cards but fade them
        existingCards.forEach(card => {
            card.style.opacity = '0.3';
            card.style.pointerEvents = 'none';
        });
        
        // Add skeleton cards
        const skeletonHTML = `
            <div class="skeleton-card skeleton-animated">
                <div class="skeleton-time"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-meta"></div>
                </div>
            </div>
        `;
        
        // Add 2-3 skeleton cards
        for (let i = 0; i < 2; i++) {
            const skeleton = document.createElement('div');
            skeleton.innerHTML = skeletonHTML;
            skeleton.classList.add('skeleton-temp');
            container.appendChild(skeleton.firstElementChild);
        }
    }
    
    async progressiveLoadContent() {
        // Simulate API call with progressive loading
        return new Promise((resolve) => {
            setTimeout(() => {
                // Remove skeleton cards
                document.querySelectorAll('.skeleton-animated').forEach(el => el.remove());
                
                // Restore existing cards
                document.querySelectorAll('.plan-card').forEach(card => {
                    card.style.opacity = '';
                    card.style.pointerEvents = '';
                });
                
                resolve();
            }, 800);
        });
    }
    
    animateContentEntrance() {
        const cards = document.querySelectorAll('.plan-card');
        cards.forEach((card, index) => {
            card.style.animation = `fadeInUp 400ms ${index * 50}ms ease-out backwards`;
        });
    }
    
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    searchPlaces(query) {
        if (!query) return;
        
        // Implement place search
        console.log('Searching for:', query);
        
        // Show search results
        // This would typically make an API call
    }
    
    performSearch(query) {
        const resultsContainer = document.querySelector('.search-results');
        
        if (!query) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        // Simulate search results
        resultsContainer.innerHTML = `
            <div class="search-result-item">
                <span class="material-icons-round">location_on</span>
                <div>
                    <div class="result-title">${query}</div>
                    <div class="result-subtitle">검색 결과</div>
                </div>
            </div>
        `;
    }
    
    validateTimeSlot(time) {
        // Check for conflicts with existing plans
        const existingTimes = Array.from(document.querySelectorAll('.card-time time'))
            .map(el => el.textContent);
        
        if (existingTimes.includes(time)) {
            this.showToast('이미 해당 시간에 일정이 있습니다');
            return false;
        }
        
        return true;
    }
    
    handleAddPlan(form) {
        const formData = new FormData(form);
        
        // Create new plan card
        const newPlan = {
            time: formData.get('time-select'),
            place: formData.get('place-search'),
            memo: formData.get('memo'),
            category: document.querySelector('.category-btn.selected')?.textContent || '기타'
        };
        
        this.addPlanToTimeline(newPlan);
        this.showToast('일정이 추가되었습니다');
        this.provideHapticFeedback('success');
        
        // Reset form
        form.reset();
    }
    
    addPlanToTimeline(plan) {
        // Implementation for adding plan to timeline
        console.log('Adding plan:', plan);
        
        // This would typically update the DOM and save to backend
    }
    
    savePlanOrder() {
        const plans = Array.from(document.querySelectorAll('.plan-card')).map((card, index) => ({
            order: index,
            title: card.querySelector('.card-title').textContent,
            time: card.querySelector('.card-time time').textContent
        }));
        
        // Save to localStorage or backend
        localStorage.setItem('planOrder', JSON.stringify(plans));
    }
    
    saveScrollPosition() {
        const mainContent = document.querySelector('.main-content');
        localStorage.setItem('scrollPosition', mainContent.scrollTop);
    }
    
    restoreScrollPosition() {
        const savedPosition = localStorage.getItem('scrollPosition');
        if (savedPosition) {
            document.querySelector('.main-content').scrollTop = parseInt(savedPosition);
        }
    }
    
    initializeMap() {
        // Placeholder for map initialization
        console.log('Initializing map view');
        
        // This would typically initialize a map library like Mapbox or Google Maps
    }
    
    prefetchContent() {
        // Prefetch next day's content for faster navigation
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                // Prefetch logic here
                console.log('Prefetching content');
            });
        }
    }
}

// ===========================================
// Initialize on DOM Content Loaded
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const planner = new MobilePlanner();
    
    // Expose to global scope for debugging
    window.planner = planner;
    
    // Add CSS for dynamic elements
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--md-sys-color-surface);
            z-index: 1000;
            transform: translateY(100%);
            transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .search-overlay.show {
            transform: translateY(0);
        }
        
        .search-header {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
        }
        
        .search-header input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 12px;
            font-size: 16px;
            outline: none;
        }
        
        .search-results {
            padding: 16px;
        }
        
        .search-result-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 200ms;
        }
        
        .search-result-item:hover {
            background: var(--md-sys-color-surface-container);
        }
        
        .result-title {
            font-weight: 500;
            color: var(--md-sys-color-on-surface);
        }
        
        .result-subtitle {
            font-size: 14px;
            color: var(--md-sys-color-on-surface-variant);
        }
    `;
    document.head.appendChild(style);
    
    // Log performance metrics
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Metrics:', {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                domInteractive: perfData.domInteractive,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime
            });
        });
    }
});

// ===========================================
// Performance Optimization: Debounce & Throttle
// ===========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}