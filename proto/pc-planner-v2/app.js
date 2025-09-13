// TPlan PC v2 - Enhanced UX Application
class TPlanApp {
    constructor() {
        // Core state
        this.state = {
            tripTitle: '도쿄 여행',
            startDate: '2025-01-15',
            endDate: '2025-01-21',
            totalDays: 7,
            currentDay: 0,
            categoryFilter: 'all',
            viewMode: 'edit',
            timeRangeStart: 7,
            timeRangeEnd: 24,
            planBoxes: [],
            placedBoxes: [],
            nextId: 1
        };

        // Drag state
        this.dragState = {
            isDragging: false,
            draggedElement: null,
            draggedData: null,
            ghostElement: null,
            dropIndicator: null,
            originalPosition: null,
            isFromTimeline: false
        };

        // Resize state
        this.resizeState = {
            isResizing: false,
            resizingBox: null,
            startY: 0,
            originalHeight: 0,
            originalTop: 0,
            direction: null
        };

        // Performance tracking
        this.perfMonitor = {
            lastFrame: performance.now(),
            fps: 60,
            latency: 0
        };

        // Initialize
        this.init();
    }

    init() {
        // Load saved state
        this.loadState();
        
        // Initialize UI
        this.initializeDayTabs();
        this.initializeTimeGrid();
        this.renderPlanBoxes();
        this.renderPlacedBoxes();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Initialize sample data if empty
        if (this.state.planBoxes.length === 0) {
            this.initializeSampleData();
        }
    }

    // Initialize sample data
    initializeSampleData() {
        const sampleBoxes = [
            {
                id: this.state.nextId++,
                title: '츠키지 시장',
                category: 'food',
                startHour: null,
                startMinute: null,
                durationHour: 2,
                durationMinute: 0,
                cost: '5,000엔',
                memo: '신선한 해산물 아침식사',
                hasTimeSet: false
            },
            {
                id: this.state.nextId++,
                title: '센소지',
                category: 'tour',
                startHour: null,
                startMinute: null,
                durationHour: 1,
                durationMinute: 30,
                cost: '무료',
                memo: '도쿄에서 가장 오래된 사찰',
                hasTimeSet: false
            },
            {
                id: this.state.nextId++,
                title: '아키하바라',
                category: 'shopping',
                startHour: null,
                startMinute: null,
                durationHour: 3,
                durationMinute: 0,
                cost: '30,000엔',
                memo: '전자제품 쇼핑',
                hasTimeSet: false
            },
            {
                id: this.state.nextId++,
                title: '신주쿠 호텔',
                category: 'hotel',
                startHour: null,
                startMinute: null,
                durationHour: 12,
                durationMinute: 0,
                cost: '15,000엔',
                memo: '체크인 15:00',
                hasTimeSet: false
            }
        ];

        this.state.planBoxes = sampleBoxes;
        this.saveState();
        this.renderPlanBoxes();
    }

    // Initialize day tabs
    initializeDayTabs() {
        const container = document.querySelector('.day-tabs');
        container.innerHTML = '';

        const startDate = new Date(this.state.startDate);
        
        for (let i = 0; i < this.state.totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            const tab = document.createElement('button');
            tab.className = `day-tab ${i === this.state.currentDay ? 'active' : ''}`;
            tab.dataset.day = i;
            tab.innerHTML = `
                <div>Day ${i + 1}</div>
                <div class="day-tab-date">${date.getMonth() + 1}/${date.getDate()}</div>
            `;
            
            tab.addEventListener('click', () => this.switchDay(i));
            container.appendChild(tab);
        }
    }

    // Initialize time grid
    initializeTimeGrid() {
        const timeLabels = document.querySelector('.time-labels');
        const dayColumns = document.querySelector('.day-columns');
        
        timeLabels.innerHTML = '';
        dayColumns.innerHTML = '';

        // Create time labels
        for (let hour = this.state.timeRangeStart; hour < this.state.timeRangeEnd; hour++) {
            const label = document.createElement('div');
            label.className = 'time-label';
            label.textContent = `${hour}:00`;
            timeLabels.appendChild(label);
        }

        // Create day columns
        for (let day = 0; day < this.state.totalDays; day++) {
            const column = document.createElement('div');
            column.className = `day-column ${day === this.state.currentDay ? 'active' : ''}`;
            column.dataset.day = day;
            column.style.display = day === this.state.currentDay ? 'block' : 'none';

            // Create hour slots
            for (let hour = this.state.timeRangeStart; hour < this.state.timeRangeEnd; hour++) {
                const slot = document.createElement('div');
                slot.className = 'hour-slot';
                slot.dataset.hour = hour;
                column.appendChild(slot);
            }

            // Setup drop zone
            this.setupDropZone(column);
            dayColumns.appendChild(column);
        }
    }

    // Render plan boxes in sidebar
    renderPlanBoxes() {
        const container = document.getElementById('planboxList');
        container.innerHTML = '';

        const filteredBoxes = this.state.planBoxes.filter(box => {
            if (this.state.categoryFilter === 'all') return true;
            return box.category === this.state.categoryFilter;
        });

        filteredBoxes.forEach(box => {
            const element = this.createPlanBoxElement(box);
            container.appendChild(element);
        });
    }

    // Create plan box element
    createPlanBoxElement(box) {
        const div = document.createElement('div');
        div.className = 'planbox-item draggable';
        div.draggable = true;
        div.dataset.id = box.id;
        
        const categoryColors = {
            food: 'category-food',
            tour: 'category-tour',
            shopping: 'category-shopping',
            hotel: 'category-hotel',
            transport: 'category-transport'
        };

        div.innerHTML = `
            <div class="planbox-header">
                <span class="planbox-title">${box.title}</span>
                <span class="planbox-category ${categoryColors[box.category]}">${box.category}</span>
            </div>
            <div class="planbox-details">
                ${box.durationHour || box.durationMinute ? 
                    `<span class="planbox-duration">⏱ ${box.durationHour}시간 ${box.durationMinute}분</span>` : ''}
                ${box.cost ? `<span class="planbox-cost">💰 ${box.cost}</span>` : ''}
                ${box.memo ? `<span class="planbox-memo">📝 ${box.memo}</span>` : ''}
            </div>
            <div class="planbox-actions">
                <button class="action-btn edit-btn" data-id="${box.id}">편집</button>
                <button class="action-btn clone-btn" data-id="${box.id}">복제</button>
                <button class="action-btn delete-btn" data-id="${box.id}">삭제</button>
            </div>
        `;

        // Setup drag
        this.setupDraggable(div, box);

        // Setup action buttons
        div.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editPlanBox(box.id);
        });

        div.querySelector('.clone-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.clonePlanBox(box.id);
        });

        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePlanBox(box.id);
        });

        return div;
    }

    // Render placed boxes on timeline
    renderPlacedBoxes() {
        // Clear existing placed boxes
        document.querySelectorAll('.placed-box').forEach(el => el.remove());

        // Render boxes for current day
        const currentDayBoxes = this.state.placedBoxes.filter(box => box.dayIndex === this.state.currentDay);
        
        currentDayBoxes.forEach(box => {
            this.renderPlacedBox(box);
        });
    }

    // Render single placed box
    renderPlacedBox(box) {
        const column = document.querySelector(`.day-column[data-day="${box.dayIndex}"]`);
        if (!column) return;

        const div = document.createElement('div');
        div.className = 'placed-box';
        div.dataset.id = box.id;
        div.draggable = true;

        // Calculate position
        const hourHeight = 60;
        const top = (box.startHour - this.state.timeRangeStart) * hourHeight + (box.startMinute / 60) * hourHeight;
        const height = box.durationHour * hourHeight + (box.durationMinute / 60) * hourHeight;

        div.style.top = `${top}px`;
        div.style.height = `${height}px`;
        
        // Set category color
        const categoryColors = {
            food: '#FEF3C7',
            tour: '#DBEAFE',
            shopping: '#F3E8FF',
            hotel: '#FFE4E6',
            transport: '#D1FAE5'
        };
        div.style.backgroundColor = categoryColors[box.category] || '#F3F4F6';

        div.innerHTML = `
            <div class="resize-handle top"></div>
            <div class="placed-box-header">
                <span class="placed-box-title">${box.title}</span>
            </div>
            <div class="placed-box-time">${this.formatTime(box.startHour, box.startMinute)} - ${this.formatEndTime(box)}</div>
            <div class="placed-box-duration">${box.durationHour}시간 ${box.durationMinute}분</div>
            <div class="resize-handle bottom"></div>
        `;

        // Setup interactions
        this.setupPlacedBoxInteractions(div, box);
        
        column.appendChild(div);
    }

    // Setup draggable element
    setupDraggable(element, data) {
        element.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, element, data, false);
        });

        element.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });
    }

    // Setup placed box interactions
    setupPlacedBoxInteractions(element, box) {
        // Drag
        element.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, element, box, true);
        });

        element.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        // Double click to edit
        element.addEventListener('dblclick', () => {
            this.editPlacedBox(box.id);
        });

        // Resize handles
        const topHandle = element.querySelector('.resize-handle.top');
        const bottomHandle = element.querySelector('.resize-handle.bottom');

        topHandle.addEventListener('mousedown', (e) => {
            this.startResize(e, box, 'top');
        });

        bottomHandle.addEventListener('mousedown', (e) => {
            this.startResize(e, box, 'bottom');
        });

        // Right click menu
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, box);
        });
    }

    // Setup drop zone
    setupDropZone(column) {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e, column);
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e, column);
        });

        column.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, column);
        });
    }

    // Drag handlers
    handleDragStart(e, element, data, isFromTimeline) {
        this.dragState.isDragging = true;
        this.dragState.draggedElement = element;
        this.dragState.draggedData = data;
        this.dragState.isFromTimeline = isFromTimeline;

        element.classList.add('dragging');
        
        // Create ghost element
        const ghost = element.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = element.offsetWidth + 'px';
        document.body.appendChild(ghost);
        this.dragState.ghostElement = ghost;

        // Set drag image to empty
        const emptyImg = new Image();
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        
        // Store original position if from timeline
        if (isFromTimeline) {
            this.dragState.originalPosition = {
                dayIndex: data.dayIndex,
                startHour: data.startHour,
                startMinute: data.startMinute
            };
        }

        // Show performance indicator
        this.updatePerformance();
    }

    handleDragOver(e, column) {
        e.preventDefault();
        
        if (!this.dragState.isDragging) return;

        column.classList.add('drop-active');

        // Update ghost position
        if (this.dragState.ghostElement) {
            this.dragState.ghostElement.style.left = e.clientX + 10 + 'px';
            this.dragState.ghostElement.style.top = e.clientY + 10 + 'px';
        }

        // Calculate drop position
        const rect = column.getBoundingClientRect();
        const relativeY = e.clientY - rect.top + column.scrollTop;
        const hourHeight = 60;
        const hour = Math.floor(relativeY / hourHeight) + this.state.timeRangeStart;
        const minuteFraction = (relativeY % hourHeight) / hourHeight;
        const minute = Math.round(minuteFraction * 60 / 15) * 15; // Snap to 15 minutes

        // Show drop indicator
        this.showDropIndicator(column, hour, minute);

        // Show time badge
        this.showTimeBadge(e.clientX, e.clientY, `${this.formatTime(hour, minute)}`);

        // Check for conflicts
        if (this.dragState.draggedData) {
            const dayIndex = parseInt(column.dataset.day);
            const conflicts = this.checkConflicts(dayIndex, hour, minute, this.dragState.draggedData);
            if (conflicts.length > 0) {
                this.showConflictAlert('시간이 겹칩니다!');
            } else {
                this.hideConflictAlert();
            }
        }
    }

    handleDrop(e, column) {
        e.preventDefault();
        
        if (!this.dragState.isDragging || !this.dragState.draggedData) return;

        const rect = column.getBoundingClientRect();
        const relativeY = e.clientY - rect.top + column.scrollTop;
        const hourHeight = 60;
        const hour = Math.floor(relativeY / hourHeight) + this.state.timeRangeStart;
        const minuteFraction = (relativeY % hourHeight) / hourHeight;
        const minute = Math.round(minuteFraction * 60 / 15) * 15;
        const dayIndex = parseInt(column.dataset.day);

        // Check for conflicts
        const conflicts = this.checkConflicts(dayIndex, hour, minute, this.dragState.draggedData);
        if (conflicts.length > 0) {
            this.showConflictAlert('시간이 겹쳐서 배치할 수 없습니다!');
            return;
        }

        // Place the box
        if (this.dragState.isFromTimeline) {
            // Move existing box
            const box = this.state.placedBoxes.find(b => b.id === this.dragState.draggedData.id);
            if (box) {
                box.dayIndex = dayIndex;
                box.startHour = hour;
                box.startMinute = minute;
            }
        } else {
            // Add new box from sidebar
            const newBox = {
                ...this.dragState.draggedData,
                dayIndex: dayIndex,
                startHour: hour,
                startMinute: minute,
                hasTimeSet: true
            };
            this.state.placedBoxes.push(newBox);
        }

        this.saveState();
        this.renderPlacedBoxes();
        
        // Show success feedback
        this.showToast('플랜박스가 배치되었습니다');
        
        // Animate the placement
        requestAnimationFrame(() => {
            const placedElement = document.querySelector(`.placed-box[data-id="${this.dragState.draggedData.id}"]`);
            if (placedElement) {
                placedElement.style.animation = 'bounceIn 0.3s ease-out';
            }
        });
    }

    handleDragLeave(e, column) {
        if (!column.contains(e.relatedTarget)) {
            column.classList.remove('drop-active');
            this.hideDropIndicator();
            this.hideTimeBadge();
        }
    }

    handleDragEnd(e) {
        // Clean up
        if (this.dragState.draggedElement) {
            this.dragState.draggedElement.classList.remove('dragging');
        }
        
        if (this.dragState.ghostElement) {
            this.dragState.ghostElement.remove();
        }

        document.querySelectorAll('.drop-active').forEach(el => {
            el.classList.remove('drop-active');
        });

        this.hideDropIndicator();
        this.hideTimeBadge();
        this.hideConflictAlert();

        // Reset drag state
        this.dragState = {
            isDragging: false,
            draggedElement: null,
            draggedData: null,
            ghostElement: null,
            originalPosition: null,
            isFromTimeline: false
        };
    }

    // Resize handlers
    startResize(e, box, direction) {
        e.preventDefault();
        e.stopPropagation();

        this.resizeState.isResizing = true;
        this.resizeState.resizingBox = box;
        this.resizeState.startY = e.clientY;
        this.resizeState.direction = direction;

        const element = document.querySelector(`.placed-box[data-id="${box.id}"]`);
        if (element) {
            this.resizeState.originalHeight = element.offsetHeight;
            this.resizeState.originalTop = element.offsetTop;
            element.classList.add('resizing');
        }

        document.addEventListener('mousemove', this.handleResize.bind(this));
        document.addEventListener('mouseup', this.endResize.bind(this));
    }

    handleResize(e) {
        if (!this.resizeState.isResizing) return;

        const deltaY = e.clientY - this.resizeState.startY;
        const hourHeight = 60;
        const box = this.resizeState.resizingBox;
        const element = document.querySelector(`.placed-box[data-id="${box.id}"]`);

        if (!element) return;

        if (this.resizeState.direction === 'bottom') {
            // Resize from bottom
            const newHeight = Math.max(hourHeight / 2, this.resizeState.originalHeight + deltaY);
            const newDuration = newHeight / hourHeight;
            const hours = Math.floor(newDuration);
            const minutes = Math.round((newDuration - hours) * 60 / 15) * 15;

            element.style.height = `${newHeight}px`;
            
            // Update time badge
            this.showTimeBadge(e.clientX, e.clientY, `${hours}시간 ${minutes}분`);
        } else {
            // Resize from top
            const newTop = Math.max(0, this.resizeState.originalTop + deltaY);
            const newHeight = this.resizeState.originalHeight - deltaY;
            
            if (newHeight >= hourHeight / 2) {
                element.style.top = `${newTop}px`;
                element.style.height = `${newHeight}px`;
                
                const newStartHour = Math.floor(newTop / hourHeight) + this.state.timeRangeStart;
                const newStartMinute = Math.round(((newTop % hourHeight) / hourHeight) * 60 / 15) * 15;
                
                this.showTimeBadge(e.clientX, e.clientY, this.formatTime(newStartHour, newStartMinute));
            }
        }
    }

    endResize(e) {
        if (!this.resizeState.isResizing) return;

        const box = this.resizeState.resizingBox;
        const element = document.querySelector(`.placed-box[data-id="${box.id}"]`);
        
        if (element) {
            element.classList.remove('resizing');
            
            // Update box data
            const hourHeight = 60;
            
            if (this.resizeState.direction === 'bottom') {
                const newHeight = element.offsetHeight;
                const newDuration = newHeight / hourHeight;
                box.durationHour = Math.floor(newDuration);
                box.durationMinute = Math.round((newDuration - box.durationHour) * 60 / 15) * 15;
            } else {
                const newTop = element.offsetTop;
                box.startHour = Math.floor(newTop / hourHeight) + this.state.timeRangeStart;
                box.startMinute = Math.round(((newTop % hourHeight) / hourHeight) * 60 / 15) * 15;
                
                const newHeight = element.offsetHeight;
                const newDuration = newHeight / hourHeight;
                box.durationHour = Math.floor(newDuration);
                box.durationMinute = Math.round((newDuration - box.durationHour) * 60 / 15) * 15;
            }
            
            this.saveState();
            this.renderPlacedBoxes();
        }

        this.hideTimeBadge();
        
        // Reset resize state
        this.resizeState = {
            isResizing: false,
            resizingBox: null,
            startY: 0,
            originalHeight: 0,
            originalTop: 0,
            direction: null
        };

        document.removeEventListener('mousemove', this.handleResize.bind(this));
        document.removeEventListener('mouseup', this.endResize.bind(this));
    }

    // Conflict checking
    checkConflicts(dayIndex, startHour, startMinute, box) {
        const conflicts = [];
        const startTime = startHour * 60 + startMinute;
        const endTime = startTime + box.durationHour * 60 + box.durationMinute;

        this.state.placedBoxes.forEach(placedBox => {
            if (placedBox.dayIndex === dayIndex && placedBox.id !== box.id) {
                const placedStart = placedBox.startHour * 60 + placedBox.startMinute;
                const placedEnd = placedStart + placedBox.durationHour * 60 + placedBox.durationMinute;

                if ((startTime >= placedStart && startTime < placedEnd) ||
                    (endTime > placedStart && endTime <= placedEnd) ||
                    (startTime <= placedStart && endTime >= placedEnd)) {
                    conflicts.push(placedBox);
                }
            }
        });

        return conflicts;
    }

    // UI helpers
    showDropIndicator(column, hour, minute) {
        let indicator = document.getElementById('dropIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'dropIndicator';
            indicator.className = 'drop-indicator';
            document.body.appendChild(indicator);
        }

        const rect = column.getBoundingClientRect();
        const hourHeight = 60;
        const top = (hour - this.state.timeRangeStart) * hourHeight + (minute / 60) * hourHeight;

        indicator.style.top = `${rect.top + top}px`;
        indicator.style.left = `${rect.left + 8}px`;
        indicator.style.width = `${rect.width - 16}px`;
        indicator.classList.add('active');
    }

    hideDropIndicator() {
        const indicator = document.getElementById('dropIndicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    showTimeBadge(x, y, text) {
        const badge = document.getElementById('timeBadge');
        badge.textContent = text;
        badge.style.left = `${x}px`;
        badge.style.top = `${y}px`;
        badge.classList.add('active');
    }

    hideTimeBadge() {
        const badge = document.getElementById('timeBadge');
        badge.classList.remove('active');
    }

    showConflictAlert(message) {
        const alert = document.getElementById('conflictAlert');
        alert.querySelector('.alert-message').textContent = message;
        alert.classList.add('active');
    }

    hideConflictAlert() {
        const alert = document.getElementById('conflictAlert');
        alert.classList.remove('active');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    // Modal handlers
    openPlanBoxModal(box = null) {
        const modal = document.getElementById('planBoxModal');
        modal.classList.add('active');

        if (box) {
            // Edit mode
            document.getElementById('placeNameInput').value = box.title || '';
            document.getElementById('startHour').value = box.startHour || '';
            document.getElementById('startMinute').value = box.startMinute || '';
            document.getElementById('durationHour').value = box.durationHour || 1;
            document.getElementById('durationMinute').value = box.durationMinute || 0;
            document.getElementById('costInput').value = box.cost || '';
            document.getElementById('memoInput').value = box.memo || '';

            // Set category
            document.querySelectorAll('.category-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === box.category);
            });

            // Store current box for save
            modal.dataset.boxId = box.id;
        } else {
            // Create mode
            this.resetModal();
            modal.dataset.boxId = '';
        }
    }

    closePlanBoxModal() {
        const modal = document.getElementById('planBoxModal');
        modal.classList.remove('active');
        this.resetModal();
    }

    resetModal() {
        document.getElementById('placeNameInput').value = '';
        document.getElementById('startHour').value = '';
        document.getElementById('startMinute').value = '';
        document.getElementById('durationHour').value = 1;
        document.getElementById('durationMinute').value = 0;
        document.getElementById('costInput').value = '';
        document.getElementById('memoInput').value = '';
        document.querySelectorAll('.category-option').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    savePlanBox() {
        const modal = document.getElementById('planBoxModal');
        const boxId = modal.dataset.boxId;

        const title = document.getElementById('placeNameInput').value;
        if (!title) {
            this.showToast('장소명을 입력해주세요');
            return;
        }

        const category = document.querySelector('.category-option.active')?.dataset.category || 'tour';
        const startHour = parseInt(document.getElementById('startHour').value) || null;
        const startMinute = parseInt(document.getElementById('startMinute').value) || null;
        const durationHour = parseInt(document.getElementById('durationHour').value) || 1;
        const durationMinute = parseInt(document.getElementById('durationMinute').value) || 0;
        const cost = document.getElementById('costInput').value;
        const memo = document.getElementById('memoInput').value;

        if (boxId) {
            // Update existing box
            const box = this.state.planBoxes.find(b => b.id == boxId) || 
                       this.state.placedBoxes.find(b => b.id == boxId);
            if (box) {
                Object.assign(box, {
                    title, category, startHour, startMinute,
                    durationHour, durationMinute, cost, memo,
                    hasTimeSet: startHour !== null
                });
            }
        } else {
            // Create new box
            const newBox = {
                id: this.state.nextId++,
                title, category, startHour, startMinute,
                durationHour, durationMinute, cost, memo,
                hasTimeSet: startHour !== null
            };
            this.state.planBoxes.push(newBox);
        }

        this.saveState();
        this.renderPlanBoxes();
        this.renderPlacedBoxes();
        this.closePlanBoxModal();
        this.showToast('저장되었습니다');
    }

    // Transport modal
    openTransportModal(box = null) {
        const modal = document.getElementById('transportModal');
        modal.classList.add('active');

        // Calculate route automatically
        if (box && box.dayIndex !== undefined) {
            const placedBoxes = this.state.placedBoxes
                .filter(b => b.dayIndex === box.dayIndex)
                .sort((a, b) => (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute));

            const index = placedBoxes.findIndex(b => b.id === box.id);
            if (index > 0) {
                const prevBox = placedBoxes[index - 1];
                const nextBox = placedBoxes[index + 1];

                document.getElementById('transportOrigin').value = prevBox ? prevBox.title : '';
                document.getElementById('transportDestination').value = nextBox ? nextBox.title : '';

                // Simulate route calculation
                const distance = (Math.random() * 5 + 0.5).toFixed(1);
                const duration = Math.round(Math.random() * 30 + 5);
                
                document.getElementById('transportDistance').textContent = `${distance} km`;
                document.getElementById('transportDuration').textContent = `${duration}분`;
            }
        }
    }

    closeTransportModal() {
        const modal = document.getElementById('transportModal');
        modal.classList.remove('active');
    }

    // Actions
    editPlanBox(id) {
        const box = this.state.planBoxes.find(b => b.id === id);
        if (box) {
            this.openPlanBoxModal(box);
        }
    }

    editPlacedBox(id) {
        const box = this.state.placedBoxes.find(b => b.id === id);
        if (box) {
            this.openPlanBoxModal(box);
        }
    }

    clonePlanBox(id) {
        const box = this.state.planBoxes.find(b => b.id === id);
        if (box) {
            const clone = {
                ...box,
                id: this.state.nextId++,
                title: box.title + ' (복사)'
            };
            this.state.planBoxes.push(clone);
            this.saveState();
            this.renderPlanBoxes();
            this.showToast('복제되었습니다');
        }
    }

    deletePlanBox(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.state.planBoxes = this.state.planBoxes.filter(b => b.id !== id);
            this.state.placedBoxes = this.state.placedBoxes.filter(b => b.id !== id);
            this.saveState();
            this.renderPlanBoxes();
            this.renderPlacedBoxes();
            this.showToast('삭제되었습니다');
        }
    }

    switchDay(dayIndex) {
        this.state.currentDay = dayIndex;
        
        // Update tabs
        document.querySelectorAll('.day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === dayIndex);
        });

        // Update columns
        document.querySelectorAll('.day-column').forEach((column, index) => {
            column.style.display = index === dayIndex ? 'block' : 'none';
        });

        this.renderPlacedBoxes();
    }

    // Context menu
    showContextMenu(e, box) {
        // Implementation for context menu
        console.log('Context menu for box:', box);
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New plan box
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openPlanBoxModal();
            }

            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveState();
                this.showToast('저장되었습니다');
            }

            // Delete: Remove selected
            if (e.key === 'Delete') {
                // Implementation for delete selected
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closePlanBoxModal();
                this.closeTransportModal();
            }

            // Arrow keys: Navigate days
            if (e.key === 'ArrowLeft' && this.state.currentDay > 0) {
                this.switchDay(this.state.currentDay - 1);
            }
            if (e.key === 'ArrowRight' && this.state.currentDay < this.state.totalDays - 1) {
                this.switchDay(this.state.currentDay + 1);
            }
        });
    }

    // Event listeners
    setupEventListeners() {
        // Header inputs
        document.querySelector('.trip-title').addEventListener('change', (e) => {
            this.state.tripTitle = e.target.value;
            this.saveState();
        });

        document.querySelector('.start-date').addEventListener('change', (e) => {
            this.state.startDate = e.target.value;
            this.updateDates();
        });

        document.querySelector('.end-date').addEventListener('change', (e) => {
            this.state.endDate = e.target.value;
            this.updateDates();
        });

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.viewMode = btn.dataset.view;
                document.querySelectorAll('.view-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                this.applyViewMode();
            });
        });

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.categoryFilter = btn.dataset.category;
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                this.renderPlanBoxes();
            });
        });

        // Add plan button
        document.getElementById('addPlanBtn').addEventListener('click', () => {
            this.openPlanBoxModal();
        });

        // Modal controls
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closePlanBoxModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.closePlanBoxModal();
        });

        document.getElementById('modalSave').addEventListener('click', () => {
            this.savePlanBox();
        });

        // Category options in modal
        document.querySelectorAll('.category-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-option').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });

        // Transport modal
        document.getElementById('transportClose').addEventListener('click', () => {
            this.closeTransportModal();
        });

        document.getElementById('transportCancel').addEventListener('click', () => {
            this.closeTransportModal();
        });

        document.getElementById('transportSave').addEventListener('click', () => {
            this.closeTransportModal();
            this.showToast('이동 정보가 저장되었습니다');
        });

        // Transport mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });

        // Transport box drag
        const transportBox = document.querySelector('.transport-box');
        this.setupDraggable(transportBox, {
            id: -1,
            title: '이동',
            category: 'transport',
            durationHour: 0,
            durationMinute: 30,
            transportMode: 'car'
        });

        // Modal overlay close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.closePlanBoxModal();
                this.closeTransportModal();
            });
        });
    }

    // View mode handling
    applyViewMode() {
        const container = document.querySelector('.timeline-container');
        
        switch (this.state.viewMode) {
            case 'compress':
                container.classList.add('compress-view');
                break;
            case 'print':
                window.print();
                break;
            default:
                container.classList.remove('compress-view');
        }
    }

    // Date handling
    updateDates() {
        const start = new Date(this.state.startDate);
        const end = new Date(this.state.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        this.state.totalDays = diffDays;
        document.querySelector('.total-days').textContent = `${diffDays}일`;
        
        this.initializeDayTabs();
        this.initializeTimeGrid();
        this.renderPlacedBoxes();
    }

    // Utility functions
    formatTime(hour, minute) {
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        return `${h}:${m}`;
    }

    formatEndTime(box) {
        const totalMinutes = box.startHour * 60 + box.startMinute + box.durationHour * 60 + box.durationMinute;
        const endHour = Math.floor(totalMinutes / 60);
        const endMinute = totalMinutes % 60;
        return this.formatTime(endHour, endMinute);
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        const monitor = () => {
            const now = performance.now();
            const delta = now - this.perfMonitor.lastFrame;
            this.perfMonitor.fps = Math.round(1000 / delta);
            this.perfMonitor.lastFrame = now;

            // Update display
            document.querySelector('.fps').textContent = `${this.perfMonitor.fps} FPS`;
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }

    updatePerformance() {
        const start = performance.now();
        requestAnimationFrame(() => {
            const latency = Math.round(performance.now() - start);
            this.perfMonitor.latency = latency;
            document.querySelector('.latency').textContent = `${latency}ms`;
        });
    }

    // Local storage
    saveState() {
        const data = {
            ...this.state,
            timestamp: Date.now()
        };
        localStorage.setItem('tplan-pc-v2', JSON.stringify(data));
    }

    loadState() {
        const saved = localStorage.getItem('tplan-pc-v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    ...data
                };
                
                // Update UI with loaded state
                document.querySelector('.trip-title').value = this.state.tripTitle;
                document.querySelector('.start-date').value = this.state.startDate;
                document.querySelector('.end-date').value = this.state.endDate;
                document.querySelector('.total-days').textContent = `${this.state.totalDays}일`;
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TPlanApp();
    console.log('TPlan PC v2 initialized');
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    if (window.app && window.app.state.placedBoxes.length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});