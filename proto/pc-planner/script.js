// Plan data
const initialPlans = [
    {
        id: 'plan-1',
        title: '경복궁',
        category: 'attraction',
        icon: '🏛️',
        duration: 120,
        description: '조선 왕조의 대표 궁궐',
        address: '서울 종로구 사직로 161'
    },
    {
        id: 'plan-2',
        title: '광장시장',
        category: 'food',
        icon: '🍜',
        duration: 90,
        description: '전통 시장과 먹거리',
        address: '서울 종로구 창경궁로 88'
    },
    {
        id: 'plan-3',
        title: '남산타워',
        category: 'attraction',
        icon: '🗼',
        duration: 180,
        description: '서울의 랜드마크',
        address: '서울 용산구 남산공원길 105'
    },
    {
        id: 'plan-4',
        title: '택시 이동',
        category: 'transport',
        icon: '🚕',
        duration: 30,
        description: '경복궁 → 광장시장',
        address: '약 15분 소요'
    }
];

// State management
const state = {
    plans: [...initialPlans],
    placedPlans: new Map(),
    draggedPlan: null,
    currentFilter: 'all',
    editingPlan: null
};

// DOM elements
const planBoxesContainer = document.getElementById('planBoxesContainer');
const ghostElement = document.getElementById('ghostElement');
const dropIndicator = document.getElementById('dropIndicator');
const editModal = document.getElementById('editModal');
const timeline = document.getElementById('timeline');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderPlanBoxes();
    setupEventListeners();
    setupModalListeners();
    setupFilterListeners();
    
    // Performance optimization: Use passive listeners for scroll
    timeline.addEventListener('scroll', handleTimelineScroll, { passive: true });
});

// Render plan boxes in sidebar
function renderPlanBoxes() {
    const filteredPlans = state.currentFilter === 'all' 
        ? state.plans 
        : state.plans.filter(plan => plan.category === state.currentFilter);
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredPlans.forEach(plan => {
        if (!state.placedPlans.has(plan.id)) {
            const planBox = createPlanBox(plan);
            fragment.appendChild(planBox);
        }
    });
    
    planBoxesContainer.innerHTML = '';
    planBoxesContainer.appendChild(fragment);
}

// Create plan box element
function createPlanBox(plan, isPlaced = false) {
    const div = document.createElement('div');
    div.className = `plan-box ${isPlaced ? 'placed' : ''}`;
    div.dataset.planId = plan.id;
    div.draggable = !isPlaced;
    
    div.innerHTML = `
        <div class="plan-box-header">
            <div class="plan-icon ${plan.category}">${plan.icon}</div>
            <div class="plan-info">
                <div class="plan-title">${plan.title}</div>
                <div class="plan-meta">
                    <span class="meta-item">⏱ ${formatDuration(plan.duration)}</span>
                    <span class="meta-item">📍 ${plan.category}</span>
                </div>
            </div>
        </div>
    `;
    
    // Setup drag events
    if (!isPlaced) {
        setupDragEvents(div, plan);
    } else {
        div.addEventListener('click', () => openEditModal(plan));
    }
    
    return div;
}

// Setup drag events with performance optimization
function setupDragEvents(element, plan) {
    let dragStartX = 0;
    let dragStartY = 0;
    
    element.addEventListener('dragstart', (e) => {
        state.draggedPlan = plan;
        element.classList.add('dragging');
        
        // Store initial position for smooth animation
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        // Setup ghost element
        const rect = element.getBoundingClientRect();
        ghostElement.innerHTML = element.innerHTML;
        ghostElement.style.width = `${rect.width}px`;
        ghostElement.classList.add('plan-box');
        
        // Use empty image for drag
        const emptyImg = new Image();
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        e.dataTransfer.effectAllowed = 'move';
        
        // Request animation frame for smooth ghost movement
        requestAnimationFrame(() => {
            ghostElement.classList.add('visible');
        });
    });
    
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        ghostElement.classList.remove('visible');
        state.draggedPlan = null;
        clearDropIndicators();
    });
}

// Track drag movement for ghost element
document.addEventListener('dragover', (e) => {
    if (state.draggedPlan) {
        e.preventDefault();
        
        // Use transform for better performance
        ghostElement.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 40}px)`;
        
        // Check if over timeline
        const slot = getTimeSlotFromPoint(e.clientX, e.clientY);
        if (slot) {
            showDropIndicator(slot);
        } else {
            hideDropIndicator();
        }
    }
});

// Setup timeline drop zones
function setupEventListeners() {
    const slots = document.querySelectorAll('.slot-content');
    
    slots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            if (state.draggedPlan) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.classList.add('drag-over');
            }
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            if (state.draggedPlan && !slot.querySelector('.plan-box')) {
                placePlanInSlot(state.draggedPlan, slot);
            }
        });
    });
}

// Place plan in timeline slot with animation
function placePlanInSlot(plan, slot) {
    const time = slot.dataset.slot;
    
    // Create placed plan box
    const planBox = createPlanBox(plan, true);
    
    // Use Web Animations API for smooth placement
    slot.innerHTML = '';
    slot.appendChild(planBox);
    slot.classList.add('has-plan');
    
    // Animate placement
    planBox.animate([
        { transform: 'scale(0.8) translateY(10px)', opacity: 0 },
        { transform: 'scale(1) translateY(0)', opacity: 1 }
    ], {
        duration: 250,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    // Update state
    state.placedPlans.set(plan.id, { ...plan, time });
    
    // Re-render sidebar
    renderPlanBoxes();
    
    // Haptic feedback simulation (visual)
    slot.style.background = 'var(--bg-tertiary)';
    setTimeout(() => {
        slot.style.background = '';
    }, 150);
}

// Edit modal functionality
function openEditModal(plan) {
    state.editingPlan = plan;
    const placedInfo = state.placedPlans.get(plan.id);
    
    // Populate modal fields
    document.getElementById('planTitle').value = plan.title;
    document.getElementById('planTime').value = placedInfo?.time || '09:00';
    document.getElementById('planDuration').value = plan.duration;
    document.getElementById('planDescription').value = plan.description || '';
    
    // Show modal with animation
    editModal.classList.add('active');
    
    // Focus first input for accessibility
    setTimeout(() => {
        document.getElementById('planTitle').focus();
    }, 100);
}

// Setup modal event listeners
function setupModalListeners() {
    const modalBackdrop = editModal.querySelector('.modal-backdrop');
    const modalClose = editModal.querySelector('.modal-close');
    const btnCancel = document.getElementById('btnCancel');
    const btnDelete = document.getElementById('btnDelete');
    const btnSave = document.getElementById('btnSave');
    
    // Close modal events
    [modalBackdrop, modalClose, btnCancel].forEach(element => {
        element.addEventListener('click', closeModal);
    });
    
    // Delete button
    btnDelete.addEventListener('click', () => {
        if (state.editingPlan) {
            deletePlan(state.editingPlan.id);
            closeModal();
        }
    });
    
    // Save button
    btnSave.addEventListener('click', () => {
        if (state.editingPlan) {
            savePlanChanges();
            closeModal();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Close modal with animation
function closeModal() {
    editModal.classList.remove('active');
    state.editingPlan = null;
}

// Save plan changes
function savePlanChanges() {
    const newTime = document.getElementById('planTime').value;
    const newTitle = document.getElementById('planTitle').value;
    const newDuration = parseInt(document.getElementById('planDuration').value);
    const newDescription = document.getElementById('planDescription').value;
    
    // Update plan data
    const plan = state.plans.find(p => p.id === state.editingPlan.id);
    if (plan) {
        plan.title = newTitle;
        plan.duration = newDuration;
        plan.description = newDescription;
    }
    
    // Update placed plan time if changed
    const placedInfo = state.placedPlans.get(state.editingPlan.id);
    if (placedInfo && placedInfo.time !== newTime) {
        // Remove from current slot
        const currentSlot = document.querySelector(`[data-slot="${placedInfo.time}"]`);
        if (currentSlot) {
            currentSlot.innerHTML = '';
            currentSlot.classList.remove('has-plan');
        }
        
        // Place in new slot
        const newSlot = document.querySelector(`[data-slot="${newTime}"]`);
        if (newSlot && !newSlot.querySelector('.plan-box')) {
            placePlanInSlot(plan, newSlot);
        }
    } else {
        // Just update the display
        refreshTimeline();
    }
}

// Delete plan
function deletePlan(planId) {
    // Remove from placed plans
    const placedInfo = state.placedPlans.get(planId);
    if (placedInfo) {
        const slot = document.querySelector(`[data-slot="${placedInfo.time}"]`);
        if (slot) {
            // Animate removal
            const planBox = slot.querySelector('.plan-box');
            if (planBox) {
                planBox.animate([
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0.8)', opacity: 0 }
                ], {
                    duration: 200,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }).onfinish = () => {
                    slot.innerHTML = '';
                    slot.classList.remove('has-plan');
                };
            }
        }
        state.placedPlans.delete(planId);
    }
    
    // Remove from plans array
    state.plans = state.plans.filter(p => p.id !== planId);
    
    // Re-render sidebar
    setTimeout(() => renderPlanBoxes(), 200);
}

// Refresh timeline display
function refreshTimeline() {
    state.placedPlans.forEach((planInfo, planId) => {
        const slot = document.querySelector(`[data-slot="${planInfo.time}"]`);
        if (slot) {
            const plan = state.plans.find(p => p.id === planId);
            if (plan) {
                slot.innerHTML = '';
                slot.appendChild(createPlanBox(plan, true));
                slot.classList.add('has-plan');
            }
        }
    });
}

// Category filter functionality
function setupFilterListeners() {
    const filterChips = document.querySelectorAll('.filter-chip');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Update filter and re-render
            state.currentFilter = chip.dataset.category;
            renderPlanBoxes();
            
            // Animate filter change
            planBoxesContainer.style.opacity = '0';
            setTimeout(() => {
                planBoxesContainer.style.opacity = '1';
            }, 150);
        });
    });
}

// Helper functions
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

function getTimeSlotFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element && element.classList.contains('slot-content')) {
        return element;
    }
    return null;
}

function showDropIndicator(slot) {
    const rect = slot.getBoundingClientRect();
    dropIndicator.style.top = `${rect.top + window.scrollY}px`;
    dropIndicator.style.left = `${rect.left}px`;
    dropIndicator.style.width = `${rect.width}px`;
    dropIndicator.classList.add('active');
}

function hideDropIndicator() {
    dropIndicator.classList.remove('active');
}

function clearDropIndicators() {
    hideDropIndicator();
    document.querySelectorAll('.slot-content').forEach(slot => {
        slot.classList.remove('drag-over');
    });
}

// Performance optimization: Debounce scroll events
let scrollTimeout;
function handleTimelineScroll() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
        // Handle any scroll-based logic here
    }, 100);
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                console.log('Saving state to localStorage...');
                localStorage.setItem('tplan-state', JSON.stringify(state));
                break;
            case 'z':
                e.preventDefault();
                console.log('Undo functionality would go here');
                break;
        }
    }
});

// Performance monitoring (development only)
if (window.location.hostname === 'localhost') {
    // Monitor FPS
    let lastTime = performance.now();
    let frames = 0;
    
    function measureFPS() {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            const fps = Math.round((frames * 1000) / (currentTime - lastTime));
            console.log(`FPS: ${fps}`);
            frames = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    // Uncomment to enable FPS monitoring
    // measureFPS();
}

// Initialize smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';