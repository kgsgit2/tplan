// TPlan Planner JavaScript - Clean Professional Implementation

// Global State
let planBoxes = [
    { id: 1, title: '경복궁', category: 'tour', durationHour: 2, durationMinute: 0, cost: '3000', memo: '' },
    { id: 2, title: '명동교자', category: 'food', durationHour: 1, durationMinute: 0, cost: '15000', memo: '' },
    { id: 3, title: '명동 쇼핑거리', category: 'shopping', durationHour: 3, durationMinute: 0, cost: '100000', memo: '' }
];

let placedBoxes = [];
let currentDay = 0;
let draggedItem = null;
let currentEditingBox = null;
let nextId = 4;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    renderPlanBoxes();
    updateSummary();
});

// Event Listeners
function initializeEventListeners() {
    // Day Tabs
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentDay = parseInt(e.target.dataset.day);
            renderTimeline();
        });
    });

    // Category Filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const category = e.currentTarget.dataset.category;
            filterPlanBoxes(category);
        });
    });

    // Add PlanBox Button
    document.querySelector('.add-planbox-btn').addEventListener('click', () => {
        currentEditingBox = null;
        openModal();
    });

    // Modal Close
    document.querySelector('.modal-close').addEventListener('click', closeModal);

    // Time Slots - Drag and Drop
    setupTimeSlotsDragDrop();

    // Save button in modal
    document.querySelector('.btn-primary').addEventListener('click', savePlanBox);
}

// Drag and Drop Setup
function setupTimeSlotsDragDrop() {
    // Setup draggable items
    setupDraggableItems();

    // Setup drop zones
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);
    });
}

function setupDraggableItems() {
    document.querySelectorAll('.planbox-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// Drag Event Handlers
function handleDragStart(e) {
    draggedItem = {
        id: parseInt(e.currentTarget.dataset.id),
        type: e.currentTarget.dataset.category === 'transport' ? 'transport' : 'planbox',
        element: e.currentTarget
    };
    
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    
    // Create and show ghost element
    showDragGhost(e);
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    hideDragGhost();
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const slot = e.currentTarget;
    slot.classList.add('drag-over');
    
    // Update ghost position
    updateDragGhost(e);
    
    // Show time badge
    showTimeBadge(e, slot);
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
    hideTimeBadge();
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedItem) return;
    
    const slot = e.currentTarget;
    const hour = parseInt(slot.dataset.hour);
    const day = parseInt(slot.dataset.day);
    
    // Calculate minute based on drop position
    const rect = slot.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.round((y / rect.height) * 60 / 10) * 10; // Snap to 10 minutes
    
    // Check for conflicts
    if (checkConflict(day, hour, minute, draggedItem.id)) {
        showConflictMessage();
        return;
    }
    
    // Place the box
    placeBox(draggedItem.id, day, hour, minute);
    
    hideDragGhost();
    hideTimeBadge();
}

// Drag Ghost Functions
function showDragGhost(e) {
    const ghost = document.getElementById('drag-ghost');
    const item = e.currentTarget;
    
    ghost.innerHTML = `
        <div class="drag-ghost-content">
            ${item.querySelector('h4').textContent}
        </div>
    `;
    
    ghost.classList.add('active');
    updateDragGhostPosition(e.clientX, e.clientY);
}

function updateDragGhost(e) {
    updateDragGhostPosition(e.clientX, e.clientY);
}

function updateDragGhostPosition(x, y) {
    const ghost = document.getElementById('drag-ghost');
    ghost.style.left = x + 10 + 'px';
    ghost.style.top = y + 10 + 'px';
}

function hideDragGhost() {
    const ghost = document.getElementById('drag-ghost');
    ghost.classList.remove('active');
}

// Time Badge Functions
function showTimeBadge(e, slot) {
    const badge = document.getElementById('time-badge');
    const hour = parseInt(slot.dataset.hour);
    
    const rect = slot.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.round((y / rect.height) * 60 / 10) * 10;
    
    const timeStr = formatTime(hour, minute);
    badge.textContent = timeStr;
    badge.style.left = e.clientX + 20 + 'px';
    badge.style.top = e.clientY - 10 + 'px';
    badge.classList.add('active');
}

function hideTimeBadge() {
    const badge = document.getElementById('time-badge');
    badge.classList.remove('active');
}

// Place Box on Timeline
function placeBox(boxId, day, hour, minute) {
    const box = planBoxes.find(b => b.id === boxId);
    if (!box) return;
    
    // Remove if already placed
    placedBoxes = placedBoxes.filter(b => b.id !== boxId);
    
    // Add to placed boxes
    placedBoxes.push({
        ...box,
        day: day,
        startHour: hour,
        startMinute: minute
    });
    
    renderTimeline();
    updateSummary();
}

// Check Conflict
function checkConflict(day, hour, minute, boxId) {
    const box = planBoxes.find(b => b.id === boxId);
    if (!box) return false;
    
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + (box.durationHour * 60 + box.durationMinute);
    
    return placedBoxes.some(placed => {
        if (placed.day !== day || placed.id === boxId) return false;
        
        const placedStart = placed.startHour * 60 + placed.startMinute;
        const placedEnd = placedStart + (placed.durationHour * 60 + placed.durationMinute);
        
        return (startMinutes < placedEnd && endMinutes > placedStart);
    });
}

// Show Conflict Message
function showConflictMessage() {
    const existing = document.querySelector('.conflict-message');
    if (existing) existing.remove();
    
    const message = document.createElement('div');
    message.className = 'conflict-message';
    message.textContent = '이 시간대에 이미 다른 일정이 있습니다';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Render Functions
function renderPlanBoxes() {
    const list = document.querySelector('.planbox-list');
    const existingTransport = list.querySelector('.planbox-item.transport');
    
    // Clear all except transport
    list.innerHTML = '';
    
    planBoxes.forEach(box => {
        const item = createPlanBoxElement(box);
        list.appendChild(item);
    });
    
    // Re-add transport box
    if (existingTransport || !list.querySelector('.transport')) {
        const transportBox = createTransportBox();
        list.appendChild(transportBox);
    }
    
    setupDraggableItems();
}

function createPlanBoxElement(box) {
    const div = document.createElement('div');
    div.className = 'planbox-item';
    div.draggable = true;
    div.dataset.id = box.id;
    div.dataset.category = box.category;
    
    div.innerHTML = `
        <div class="planbox-category-bar ${box.category}"></div>
        <div class="planbox-content">
            <h4>${box.title}</h4>
            <div class="planbox-info">
                <span class="info-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${formatDuration(box.durationHour, box.durationMinute)}
                </span>
                <span class="info-cost">₩${parseInt(box.cost || 0).toLocaleString()}</span>
            </div>
        </div>
        <button class="planbox-clone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    
    // Add click event for editing
    div.addEventListener('dblclick', () => {
        currentEditingBox = box;
        openModal();
    });
    
    // Clone button
    div.querySelector('.planbox-clone').addEventListener('click', (e) => {
        e.stopPropagation();
        clonePlanBox(box);
    });
    
    return div;
}

function createTransportBox() {
    const div = document.createElement('div');
    div.className = 'planbox-item transport';
    div.draggable = true;
    div.dataset.id = 'transport-1';
    div.dataset.category = 'transport';
    
    div.innerHTML = `
        <div class="planbox-category-bar transport"></div>
        <div class="planbox-content">
            <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 17h14v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zM5 10h14v7H5zM12 4l5 6H7l5-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
                이동
            </h4>
            <div class="planbox-info">
                <span class="info-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    30분
                </span>
            </div>
        </div>
    `;
    
    return div;
}

function renderTimeline() {
    const container = document.querySelector('.placed-boxes');
    container.innerHTML = '';
    
    placedBoxes
        .filter(box => box.day === currentDay)
        .forEach(box => {
            const element = createPlacedBoxElement(box);
            container.appendChild(element);
        });
}

function createPlacedBoxElement(box) {
    const div = document.createElement('div');
    div.className = 'placed-box';
    div.draggable = true;
    
    const top = (box.startHour - 9) * 60 + box.startMinute;
    const height = box.durationHour * 60 + box.durationMinute;
    
    div.style.top = top + 'px';
    div.style.height = height + 'px';
    
    div.innerHTML = `
        <div class="placed-box-bar ${box.category}"></div>
        <div class="placed-box-content">
            <div class="placed-box-title">${box.title}</div>
            <div class="placed-box-time">
                ${formatTime(box.startHour, box.startMinute)} - 
                ${formatEndTime(box.startHour, box.startMinute, box.durationHour, box.durationMinute)}
            </div>
        </div>
        <div class="resize-handle resize-handle-top"></div>
        <div class="resize-handle resize-handle-bottom"></div>
    `;
    
    // Add drag events
    div.addEventListener('dragstart', (e) => handleTimelineDragStart(e, box));
    div.addEventListener('dragend', handleDragEnd);
    
    // Add resize events
    div.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => handleResizeStart(e, box, handle.classList.contains('resize-handle-bottom')));
    });
    
    return div;
}

function handleTimelineDragStart(e, box) {
    draggedItem = {
        id: box.id,
        type: 'timeline',
        element: e.currentTarget,
        fromDay: box.day
    };
    
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    showDragGhost(e);
}

// Resize Functions
function handleResizeStart(e, box, isBottom) {
    e.stopPropagation();
    e.preventDefault();
    
    const startY = e.clientY;
    const originalHeight = box.durationHour * 60 + box.durationMinute;
    
    const handleMouseMove = (e) => {
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(30, originalHeight + (isBottom ? deltaY : -deltaY));
        
        // Update box duration
        box.durationHour = Math.floor(newHeight / 60);
        box.durationMinute = Math.round((newHeight % 60) / 10) * 10;
        
        renderTimeline();
        updateSummary();
    };
    
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// Clone PlanBox
function clonePlanBox(box) {
    const newBox = {
        ...box,
        id: nextId++,
        title: box.title + ' (복사)'
    };
    
    planBoxes.push(newBox);
    renderPlanBoxes();
}

// Filter PlanBoxes
function filterPlanBoxes(category) {
    const items = document.querySelectorAll('.planbox-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Modal Functions
function openModal() {
    const modal = document.getElementById('planbox-modal');
    modal.classList.add('show');
    
    if (currentEditingBox) {
        // Fill form with existing data
        document.getElementById('place-name').value = currentEditingBox.title;
        document.querySelector(`input[name="category"][value="${currentEditingBox.category}"]`).checked = true;
        document.getElementById('start-hour').value = currentEditingBox.startHour || '';
        document.getElementById('start-minute').value = currentEditingBox.startMinute || 0;
        document.getElementById('duration-hour').value = currentEditingBox.durationHour;
        document.getElementById('duration-minute').value = currentEditingBox.durationMinute;
        document.getElementById('memo').value = currentEditingBox.memo || '';
        document.getElementById('cost').value = currentEditingBox.cost || '';
    } else {
        // Clear form
        document.getElementById('place-name').value = '';
        document.getElementById('start-hour').value = '';
        document.getElementById('start-minute').value = '0';
        document.getElementById('duration-hour').value = '1';
        document.getElementById('duration-minute').value = '0';
        document.getElementById('memo').value = '';
        document.getElementById('cost').value = '';
    }
}

function closeModal() {
    const modal = document.getElementById('planbox-modal');
    modal.classList.remove('show');
    currentEditingBox = null;
}

function savePlanBox() {
    const title = document.getElementById('place-name').value;
    const category = document.querySelector('input[name="category"]:checked').value;
    const startHour = document.getElementById('start-hour').value;
    const startMinute = parseInt(document.getElementById('start-minute').value);
    const durationHour = parseInt(document.getElementById('duration-hour').value);
    const durationMinute = parseInt(document.getElementById('duration-minute').value);
    const memo = document.getElementById('memo').value;
    const cost = document.getElementById('cost').value;
    
    if (!title) {
        alert('장소명을 입력해주세요');
        return;
    }
    
    const boxData = {
        title,
        category,
        startHour: startHour ? parseInt(startHour) : null,
        startMinute,
        durationHour,
        durationMinute,
        memo,
        cost
    };
    
    if (currentEditingBox) {
        // Update existing
        Object.assign(currentEditingBox, boxData);
        
        // Update in placed boxes if exists
        const placedBox = placedBoxes.find(b => b.id === currentEditingBox.id);
        if (placedBox) {
            Object.assign(placedBox, boxData);
        }
    } else {
        // Create new
        const newBox = {
            id: nextId++,
            ...boxData
        };
        planBoxes.push(newBox);
    }
    
    renderPlanBoxes();
    renderTimeline();
    updateSummary();
    closeModal();
}

// Update Summary
function updateSummary() {
    let totalMinutes = 0;
    let totalCost = 0;
    
    placedBoxes.forEach(box => {
        totalMinutes += box.durationHour * 60 + box.durationMinute;
        totalCost += parseInt(box.cost || 0);
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    document.querySelector('.summary-item:nth-child(1) strong').textContent = 
        `${hours}시간 ${minutes}분`;
    document.querySelector('.summary-item:nth-child(2) strong').textContent = 
        `₩${totalCost.toLocaleString()}`;
}

// Transport Modal Functions
function closeTransportModal() {
    const modal = document.getElementById('transport-modal');
    modal.classList.remove('show');
}

// Utility Functions
function formatTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatEndTime(startHour, startMinute, durationHour, durationMinute) {
    const totalMinutes = (startHour * 60 + startMinute) + (durationHour * 60 + durationMinute);
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return formatTime(endHour, endMinute);
}

function formatDuration(hour, minute) {
    if (hour > 0 && minute > 0) {
        return `${hour}시간 ${minute}분`;
    } else if (hour > 0) {
        return `${hour}시간`;
    } else {
        return `${minute}분`;
    }
}

// Window Events
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
        closeTransportModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeTransportModal();
    }
});

// Auto-save to localStorage
window.addEventListener('beforeunload', () => {
    localStorage.setItem('tplan_planboxes', JSON.stringify(planBoxes));
    localStorage.setItem('tplan_placed', JSON.stringify(placedBoxes));
});

// Load from localStorage on start
window.addEventListener('load', () => {
    const savedPlanBoxes = localStorage.getItem('tplan_planboxes');
    const savedPlaced = localStorage.getItem('tplan_placed');
    
    if (savedPlanBoxes) {
        try {
            planBoxes = JSON.parse(savedPlanBoxes);
            nextId = Math.max(...planBoxes.map(b => b.id)) + 1;
        } catch (e) {
            console.error('Failed to load saved planboxes:', e);
        }
    }
    
    if (savedPlaced) {
        try {
            placedBoxes = JSON.parse(savedPlaced);
        } catch (e) {
            console.error('Failed to load saved placed boxes:', e);
        }
    }
    
    renderPlanBoxes();
    renderTimeline();
    updateSummary();
});