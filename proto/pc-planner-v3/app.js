/**
 * TPlan v3 - Interactive JavaScript
 * Clean, professional drag & drop functionality
 */

// ============================================
// State Management
// ============================================
const state = {
  draggedElement: null,
  draggedData: null,
  isDraggingFromTimeline: false,
  placedBoxes: [],
  currentFilter: 'all'
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initializeDragAndDrop();
  initializeCategoryFilters();
  initializeTimeSlots();
  loadSavedData();
});

// ============================================
// Drag and Drop Implementation
// ============================================
function initializeDragAndDrop() {
  // Initialize sidebar planbox cards
  const planboxCards = document.querySelectorAll('.planbox-card');
  planboxCards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });
  
  // Initialize placed planboxes on timeline
  const placedBoxes = document.querySelectorAll('.placed-planbox');
  placedBoxes.forEach(box => {
    box.setAttribute('draggable', true);
    box.addEventListener('dragstart', handleTimelineDragStart);
    box.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  state.draggedElement = e.currentTarget;
  state.isDraggingFromTimeline = false;
  
  // Extract data from the card
  const title = e.currentTarget.querySelector('.planbox-title').textContent;
  const category = e.currentTarget.dataset.category;
  const duration = parseDuration(e.currentTarget.querySelector('.planbox-meta-item span:last-child').textContent);
  
  state.draggedData = {
    id: Date.now(),
    title,
    category,
    duration
  };
  
  // Visual feedback
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  
  // Set transparent drag image
  const dragImage = new Image();
  dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
  e.dataTransfer.setDragImage(dragImage, 0, 0);
}

function handleTimelineDragStart(e) {
  state.draggedElement = e.currentTarget;
  state.isDraggingFromTimeline = true;
  
  // Extract data from placed box
  const title = e.currentTarget.querySelector('.placed-planbox-title').textContent;
  const category = e.currentTarget.dataset.category;
  
  state.draggedData = {
    id: e.currentTarget.dataset.id || Date.now(),
    title,
    category,
    element: e.currentTarget
  };
  
  // Visual feedback
  e.currentTarget.classList.add('dragging');
  e.currentTarget.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  // Clean up visual feedback
  e.currentTarget.classList.remove('dragging');
  e.currentTarget.style.opacity = '';
  
  // Hide time badge
  const timeBadge = document.getElementById('timeBadge');
  if (timeBadge) {
    timeBadge.style.display = 'none';
  }
  
  // Clear ghost elements
  document.querySelectorAll('.drag-ghost').forEach(ghost => ghost.remove());
  
  // Reset state
  state.draggedElement = null;
  state.draggedData = null;
  state.isDraggingFromTimeline = false;
}

// ============================================
// Time Slot Interactions
// ============================================
function initializeTimeSlots() {
  const timeSlots = document.querySelectorAll('.time-slot');
  
  timeSlots.forEach(slot => {
    slot.addEventListener('dragover', handleSlotDragOver);
    slot.addEventListener('dragleave', handleSlotDragLeave);
    slot.addEventListener('drop', handleSlotDrop);
  });
}

function handleSlotDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  if (!state.draggedData) return;
  
  // Visual feedback
  e.currentTarget.classList.add('drag-over');
  
  // Calculate position and show time badge
  const rect = e.currentTarget.getBoundingClientRect();
  const hour = parseInt(e.currentTarget.dataset.hour);
  const minute = Math.round((e.clientY - rect.top) / rect.height * 60 / 10) * 10;
  
  showTimeBadge(e.clientX, e.clientY, formatTime(hour, minute));
  
  // Show ghost preview
  showDragGhost(e.currentTarget, minute);
}

function handleSlotDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
  
  // Remove ghost if leaving to a non-slot element
  const relatedTarget = e.relatedTarget;
  if (!relatedTarget || !relatedTarget.classList.contains('time-slot')) {
    document.querySelectorAll('.drag-ghost').forEach(ghost => ghost.remove());
  }
}

function handleSlotDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  if (!state.draggedData) return;
  
  // Calculate drop position
  const rect = e.currentTarget.getBoundingClientRect();
  const dayIndex = parseInt(e.currentTarget.parentElement.dataset.day);
  const hour = parseInt(e.currentTarget.dataset.hour);
  const minuteOffset = (e.clientY - rect.top) / rect.height * 60;
  const minute = Math.round(minuteOffset / 10) * 10;
  
  // Create placed box
  createPlacedBox(e.currentTarget, dayIndex, hour, minute);
  
  // Clean up
  document.querySelectorAll('.drag-ghost').forEach(ghost => ghost.remove());
  const timeBadge = document.getElementById('timeBadge');
  if (timeBadge) {
    timeBadge.style.display = 'none';
  }
  
  // If dragging from timeline, remove original
  if (state.isDraggingFromTimeline && state.draggedData.element) {
    state.draggedData.element.remove();
  }
  
  // Save state
  savePlannedItems();
}

// ============================================
// Helper Functions
// ============================================
function createPlacedBox(slot, dayIndex, hour, minute) {
  const duration = state.draggedData.duration || 60;
  const height = (duration / 60) * 60; // 60px per hour
  
  // Create element
  const placedBox = document.createElement('div');
  placedBox.className = 'placed-planbox animate-slideUp';
  placedBox.dataset.category = state.draggedData.category;
  placedBox.dataset.id = state.draggedData.id;
  placedBox.setAttribute('draggable', true);
  placedBox.style.top = `${minute}px`;
  placedBox.style.height = `${height}px`;
  
  // Calculate end time
  const totalMinutes = hour * 60 + minute + duration;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  
  placedBox.innerHTML = `
    <div class="placed-planbox-title">${state.draggedData.title}</div>
    <div class="placed-planbox-time">${formatTime(hour, minute)} - ${formatTime(endHour, endMinute)}</div>
    <div class="resize-handle top"></div>
    <div class="resize-handle bottom"></div>
  `;
  
  // Add to slot
  slot.appendChild(placedBox);
  
  // Initialize drag for new box
  placedBox.addEventListener('dragstart', handleTimelineDragStart);
  placedBox.addEventListener('dragend', handleDragEnd);
  
  // Add click handler for editing
  placedBox.addEventListener('dblclick', () => openEditModal(placedBox));
}

function showDragGhost(slot, minute) {
  // Remove existing ghosts
  document.querySelectorAll('.drag-ghost').forEach(ghost => ghost.remove());
  
  if (!state.draggedData) return;
  
  const duration = state.draggedData.duration || 60;
  const height = (duration / 60) * 60;
  
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.style.top = `${minute}px`;
  ghost.style.height = `${height}px`;
  ghost.style.left = '4px';
  ghost.style.right = '4px';
  ghost.textContent = state.draggedData.title;
  
  slot.appendChild(ghost);
}

function showTimeBadge(x, y, text) {
  const badge = document.getElementById('timeBadge');
  if (badge) {
    badge.textContent = text;
    badge.style.left = `${x + 15}px`;
    badge.style.top = `${y - 30}px`;
    badge.style.display = 'block';
  }
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseDuration(text) {
  // Parse various duration formats
  let totalMinutes = 0;
  
  if (text.includes('시간')) {
    const hours = parseInt(text.match(/(\d+)시간/)?.[1] || 0);
    totalMinutes += hours * 60;
  }
  
  if (text.includes('분')) {
    const minutes = parseInt(text.match(/(\d+)분/)?.[1] || 0);
    totalMinutes += minutes;
  }
  
  return totalMinutes || 60; // Default to 1 hour
}

// ============================================
// Category Filters
// ============================================
function initializeCategoryFilters() {
  const filters = document.querySelectorAll('.category-filter');
  
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      // Update active state
      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      
      // Filter planboxes
      const category = filter.dataset.category || 'all';
      filterPlanboxes(category);
    });
  });
}

function filterPlanboxes(category) {
  const planboxes = document.querySelectorAll('.planbox-card');
  
  planboxes.forEach(box => {
    if (category === 'all' || box.dataset.category === category) {
      box.style.display = '';
    } else {
      box.style.display = 'none';
    }
  });
  
  state.currentFilter = category;
}

// ============================================
// Edit Modal (placeholder)
// ============================================
function openEditModal(planbox) {
  // This would open a modal for editing the planbox
  console.log('Edit planbox:', planbox);
  alert('편집 모달 - 구현 예정');
}

// ============================================
// Data Persistence
// ============================================
function savePlannedItems() {
  const items = [];
  document.querySelectorAll('.placed-planbox').forEach(box => {
    items.push({
      id: box.dataset.id,
      category: box.dataset.category,
      title: box.querySelector('.placed-planbox-title').textContent,
      time: box.querySelector('.placed-planbox-time').textContent,
      top: box.style.top,
      height: box.style.height,
      dayColumn: box.closest('.day-column').dataset.day,
      hour: box.closest('.time-slot').dataset.hour
    });
  });
  
  localStorage.setItem('tplan_items', JSON.stringify(items));
}

function loadSavedData() {
  const saved = localStorage.getItem('tplan_items');
  if (saved) {
    try {
      const items = JSON.parse(saved);
      // Restore items to timeline
      items.forEach(item => {
        // Find the correct slot and recreate the box
        const dayColumn = document.querySelector(`.day-column[data-day="${item.dayColumn}"]`);
        if (dayColumn) {
          const slot = dayColumn.querySelector(`.time-slot[data-hour="${item.hour}"]`);
          if (slot) {
            const box = document.createElement('div');
            box.className = 'placed-planbox';
            box.dataset.category = item.category;
            box.dataset.id = item.id;
            box.setAttribute('draggable', true);
            box.style.top = item.top;
            box.style.height = item.height;
            box.innerHTML = `
              <div class="placed-planbox-title">${item.title}</div>
              <div class="placed-planbox-time">${item.time}</div>
              <div class="resize-handle top"></div>
              <div class="resize-handle bottom"></div>
            `;
            slot.appendChild(box);
            
            // Re-initialize drag
            box.addEventListener('dragstart', handleTimelineDragStart);
            box.addEventListener('dragend', handleDragEnd);
            box.addEventListener('dblclick', () => openEditModal(box));
          }
        }
      });
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  }
}

// ============================================
// Export Functions (for testing)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatTime,
    parseDuration,
    state
  };
}