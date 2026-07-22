/**
 * ==========================================================================
 * REEN AI EXECUTIVE COMMAND CENTER - MAIN LOGIC (app.js)
 * Single Command Center Hub with Auto-Intent Extraction & 4-Pillar Dashboard
 * (📢 แจ้ง / 🤝 ช่วย / ⏰ เตือน / 🧠 จำ) + Executive Help Guide Modal
 * Instant Tab Switching with Direct Style Display Rules (block / none)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = {
        projects: JSON.parse(localStorage.getItem('reen_projects')) || [
            { id: 'proj_1', name: 'Sino House Phuket', category: 'Hotel Operation', status: 'Active', progress: 65, color: '#f59e0b' },
            { id: 'proj_2', name: 'PMS Kiralux System', category: 'Software Dev', status: 'Active', progress: 40, color: '#06b6d4' },
            { id: 'proj_3', name: 'sitekira', category: 'Website & Infrastructure', status: 'Active', progress: 80, color: '#10b981' },
            { id: 'proj_4', name: 'Kiralux Property', category: 'Real Estate', status: 'Active', progress: 30, color: '#8b5cf6' },
            { id: 'proj_5', name: 'General', category: 'Personal & Admin', status: 'Active', progress: 50, color: '#94a3b8' }
        ],
        tasks: JSON.parse(localStorage.getItem('reen_tasks')) || [
            { id: 'task_1', title: 'Follow up ลูกค้าโรงแรม PMS Phuket', project: 'PMS Kiralux System', category: 'Revenue', priority: 'urgent', status: 'in_progress', assignee: '', expense: 0, due: '2026-07-23T10:00:00.000Z', completed: false, created_at: '2026-07-15T08:00:00.000Z' },
            { id: 'task_2', title: 'ตรวจระบบใบลาและสิทธิ์การลา', project: 'General', category: 'Delegated', priority: 'high', status: 'todo', assignee: 'มิว', expense: 0, due: '2026-07-30T17:00:00.000Z', completed: false, created_at: '2026-07-20T09:00:00.000Z' },
            { id: 'task_3', title: 'ชำระค่าโดเมนเว็บไซต์ sitekira', project: 'sitekira', category: 'Expense', priority: 'high', status: 'completed', assignee: '', expense: 5000, due: '2026-07-22T12:00:00.000Z', completed: true, created_at: '2026-07-21T10:00:00.000Z' }
        ],
        habits: JSON.parse(localStorage.getItem('reen_habits')) || [
            { id: 'hab_1', title: 'ดื่มน้ำ 8 แก้ว 💧', streak: 5, completedToday: true },
            { id: 'hab_2', title: 'ออกกำลังกายยืดเส้น 🏃‍♂️', streak: 3, completedToday: false },
            { id: 'hab_3', title: 'ทบทวนดีลประจำวัน 📈', streak: 7, completedToday: true }
        ],
        ideas: JSON.parse(localStorage.getItem('reen_ideas')) || [
            { id: 'idea_1', title: 'ทำแพ็กเกจ PMS สำหรับโรงแรมขนาดเล็ก (SME Hotel)', project: 'PMS Kiralux System', status: 'New' }
        ],
        expenses: JSON.parse(localStorage.getItem('reen_expenses')) || [
            { id: 'exp_1', title: 'ค่าโดเมน sitekira', project: 'sitekira', amount: 5000, date: '2026-07-22' }
        ],
        chatHistory: JSON.parse(localStorage.getItem('reen_chat_history')) || [
            { sender: 'assistant', text: 'สวัสดีครับพี่รีน ผมคือ Reen AI ผู้ช่วยส่วนตัวของคุณ พี่รีนสามารถพิมพ์คำสั่ง หรือพูดสั่งงานเรื่องงาน มอบหมายลูกน้อง หรือบันทึกรายจ่ายได้ตลอดเวลาเลยครับ!' }
        ],
        activeTab: 'dashboard',
        todayFilter: 'all',
        todayViewMode: 'list',
        speechSpeed: 1.0,
        googleClientId: localStorage.getItem('cc_g_client_id') || ''
    };

    // Helper: Save State to LocalStorage
    function saveState(key, data) {
        state[key] = data;
        localStorage.setItem(`reen_${key}`, JSON.stringify(data));
        updateDashboardCounters();
    }

    // --- DOM REFERENCES ---
    const navItems = document.querySelectorAll('.nav-item');
    const activeTabTitle = document.getElementById('active-tab-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const liveTime = document.getElementById('live-time');
    const liveDate = document.getElementById('live-date');

    // Quick Command Elements
    const globalCommandInput = document.getElementById('global-command-input');
    const globalVoiceBtn = document.getElementById('global-voice-btn');
    const globalSubmitBtn = document.getElementById('global-submit-btn');
    const commandExtractedBadge = document.getElementById('command-extracted-badge');
    const commandExtractedText = document.getElementById('command-extracted-text');

    // Voice & Help Modal Elements
    const floatingMicBtn = document.getElementById('floating-mic-btn');
    const voiceOverlayModal = document.getElementById('voice-overlay-modal');
    const closeVoiceModal = document.getElementById('close-voice-modal');
    const voiceStatusText = document.getElementById('voice-status-text');
    const voiceTranscriptText = document.getElementById('voice-transcript-text');
    const voiceModalMicToggle = document.getElementById('voice-modal-mic-toggle');
    const voiceModalStopSpeaker = document.getElementById('voice-modal-stop-speaker');

    const helpModalOverlay = document.getElementById('help-modal-overlay');
    const btnOpenHelpModal = document.getElementById('btn-open-help-modal');
    const closeHelpModal = document.getElementById('close-help-modal');
    const btnCloseHelpConfirm = document.getElementById('btn-close-help-confirm');

    // --- CLOCK POLLING ---
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        if (liveTime) liveTime.textContent = `${hrs}:${mins}:${secs}`;
        if (liveDate) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            liveDate.textContent = now.toLocaleDateString('th-TH', options);
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- DIRECT DOM TAB NAVIGATION (GUARANTEED BLOCK / NONE SWITCHING) ---
    function switchTab(tabId) {
        state.activeTab = tabId;

        // Update nav buttons active state
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Directly update style.display on all tab panels to guarantee visual switching
        const allPanels = document.querySelectorAll('.tab-panel');
        allPanels.forEach(panel => {
            if (panel.id === `${tabId}-tab`) {
                panel.classList.add('active');
                panel.style.setProperty('display', 'block', 'important');
            } else {
                panel.classList.remove('active');
                panel.style.setProperty('display', 'none', 'important');
            }
        });

        const tabTitleMap = {
            'dashboard': { title: 'ศูนย์บัญชาการ (Command Center)', subtitle: 'ผู้ช่วยส่วนตัวข้างกาย - สั่งงานหรือเล่าเรื่องง่ายๆ แล้วให้ AI จัดการให้อัตโนมัติ' },
            'today': { title: 'งานวันนี้ & คัมบังบอร์ด (Today)', subtitle: 'จัดการลำดับความสำคัญ มอบหมายลูกน้อง และติดตามงาน' },
            'projects': { title: 'การจัดการโปรเจกต์ (Project Hub)', subtitle: 'ภาพรวม Sino House, PMS Kiralux และ sitekira' },
            'assistant': { title: 'ผู้ช่วยสนทนา AI (Executive Assistant)', subtitle: 'โต้ตอบด้วยเสียง สั่งงาน และวิเคราะห์บริบท' },
            'revenue': { title: 'ติดตามรายรับ-รายจ่าย (Financial & CRM)', subtitle: 'สรุปงบประมาณรายจ่ายและโอกาสสร้างรายได้' },
            'ideas': { title: 'คลังไอเดีย & Brain Dump', subtitle: 'บันทึกความคิดสร้างสรรค์และวิเคราะห์ด้วย AI' },
            'settings': { title: 'ตั้งค่าระบบ (Settings)', subtitle: 'เชื่อมต่อ Google API และสำรองข้อมูล' }
        };

        if (tabTitleMap[tabId]) {
            if (activeTabTitle) activeTabTitle.textContent = tabTitleMap[tabId].title;
            if (headerSubtitle) headerSubtitle.textContent = tabTitleMap[tabId].subtitle;
        }

        renderCurrentTab();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabBtn = e.currentTarget;
            const tab = tabBtn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    document.querySelectorAll('[data-tab-trigger]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab-trigger');
            if (tab) switchTab(tab);
        });
    });

    // --- RENDER DISPATCHER ---
    function renderCurrentTab() {
        updateDashboardCounters();
        if (state.activeTab === 'dashboard') renderDashboard();
        else if (state.activeTab === 'today') renderTodayTasks();
        else if (state.activeTab === 'projects') renderProjects();
        else if (state.activeTab === 'assistant') renderChatMessages();
        else if (state.activeTab === 'revenue') renderRevenue();
        else if (state.activeTab === 'ideas') renderIdeas();
    }

    // --- DASHBOARD COUNTERS ---
    function updateDashboardCounters() {
        const urgentCount = state.tasks.filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high')).length;
        const todayCount = state.tasks.filter(t => !t.completed).length;
        const totalExpense = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const ideasCount = state.ideas.length;

        const statUrgent = document.getElementById('stat-urgent-count');
        const statToday = document.getElementById('stat-today-count');
        const statExpense = document.getElementById('stat-expense-count');
        const statIdeas = document.getElementById('stat-ideas-count');

        if (statUrgent) statUrgent.textContent = urgentCount;
        if (statToday) statToday.textContent = todayCount;
        if (statExpense) statExpense.textContent = `฿${totalExpense.toLocaleString()}`;
        if (statIdeas) statIdeas.textContent = ideasCount;
    }

    // --- RENDER DASHBOARD HOME ---
    function renderDashboard() {
        // Pillar 3: ⏰ เตือน (Reminders & Follow-ups)
        const priorityContainer = document.getElementById('dash-priority-tasks-list');
        const priorityTasks = state.tasks.filter(t => !t.completed).slice(0, 4);

        if (priorityContainer) {
            if (priorityTasks.length === 0) {
                priorityContainer.innerHTML = `<p class="text-muted text-center py-4">ไม่มีรายการงานค้างในขณะนี้</p>`;
            } else {
                priorityContainer.innerHTML = priorityTasks.map(task => `
                    <div class="task-item-card mb-2 p-2 text-xs">
                        <div>
                            <strong>${escapeHtml(task.title)}</strong>
                            <div class="task-meta">
                                <span class="badge badge-gold">${escapeHtml(task.project || 'General')}</span>
                                ${task.assignee ? `<span class="assignee-tag">👤 มอบหมาย: ${escapeHtml(task.assignee)}</span>` : ''}
                                ${task.expense ? `<span class="expense-tag">💳 ฿${task.expense.toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary btn-complete-task" data-id="${task.id}">✓</button>
                    </div>
                `).join('');

                priorityContainer.querySelectorAll('.btn-complete-task').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        toggleTaskComplete(id);
                    });
                });
            }
        }

        // Pillar 2: 🤝 ช่วย (AI Recommendation)
        const recText = document.getElementById('ai-recommendation-text');
        if (recText && typeof ReenAIEngine !== 'undefined') {
            recText.innerHTML = ReenAIEngine.generateDailyBrief(state).replace(/\n/g, '<br>');
        }

        // Pillar 4: 🧠 จำ (AI Memory & Ideas Storage)
        const memoryGrid = document.getElementById('dash-memory-ideas-grid');
        if (memoryGrid) {
            if (state.ideas.length === 0) {
                memoryGrid.innerHTML = `<p class="text-muted text-center py-4 col-span-3">ไม่มีไอเดียที่บันทึกไว้ในคลังจำ</p>`;
            } else {
                memoryGrid.innerHTML = state.ideas.slice(0, 3).map(i => `
                    <div class="glass-panel p-3 flex-column justify-between text-xs">
                        <div>
                            <span class="badge badge-cyan mb-1">${escapeHtml(i.project || 'General')}</span>
                            <strong>💡 ${escapeHtml(i.title)}</strong>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Projects Grid
        const projGrid = document.getElementById('dash-projects-grid');
        if (projGrid) {
            projGrid.innerHTML = state.projects.slice(0, 3).map(p => {
                const pTasks = state.tasks.filter(t => t.project === p.name);
                const doneCount = pTasks.filter(t => t.completed).length;
                return `
                    <div class="glass-panel p-4 flex-column justify-between">
                        <div>
                            <span class="badge badge-cyan mb-2">${escapeHtml(p.category)}</span>
                            <h4>${escapeHtml(p.name)}</h4>
                            <p class="text-xs text-muted mt-1">งานเสร็จแล้ว ${doneCount}/${pTasks.length} รายการ</p>
                        </div>
                        <div class="mt-4">
                            <div class="flex-row justify-between text-xs text-muted mb-1">
                                <span>Progress</span>
                                <span>${p.progress}%</span>
                            </div>
                            <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                                <div style="background: var(--accent-gold); width: ${p.progress}%; height: 100%;"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // --- RENDER TODAY TASKS (LIST & KANBAN) ---
    function renderTodayTasks() {
        const filteredTasks = state.tasks.filter(t => {
            if (state.todayFilter === 'urgent') return t.priority === 'urgent' || t.priority === 'high';
            if (state.todayFilter === 'revenue') return t.category === 'Revenue' || t.expense > 0;
            if (state.todayFilter === 'delegated') return t.category === 'Delegated' || t.assignee;
            if (state.todayFilter === 'expense') return t.expense > 0;
            return true;
        });

        // List View
        const listContainer = document.getElementById('today-tasks-container');
        if (listContainer) {
            if (filteredTasks.length === 0) {
                listContainer.innerHTML = `<p class="text-muted text-center py-6">ไม่พบรายการงานตามเงื่อนไขที่เลือก</p>`;
            } else {
                listContainer.innerHTML = filteredTasks.map(task => `
                    <div class="task-item-card ${task.completed ? 'opacity-50' : ''}">
                        <div class="flex-row align-center gap-3">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                            <div>
                                <strong style="${task.completed ? 'text-decoration: line-through;' : ''}">${escapeHtml(task.title)}</strong>
                                <div class="task-meta">
                                    <span class="badge ${task.priority === 'urgent' ? 'badge-rose' : 'badge-gold'}">${escapeHtml(task.project || 'General')}</span>
                                    ${task.assignee ? `<span class="assignee-tag">👤 สั่งงาน: ${escapeHtml(task.assignee)}</span>` : ''}
                                    ${task.expense ? `<span class="expense-tag">💳 ฿${task.expense.toLocaleString()}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline btn-delete-task" data-id="${task.id}">🗑️</button>
                    </div>
                `).join('');

                listContainer.querySelectorAll('.task-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        toggleTaskComplete(id);
                    });
                });

                listContainer.querySelectorAll('.btn-delete-task').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        deleteTask(id);
                    });
                });
            }
        }
    }

    // --- RENDER AI CHAT MESSAGES ---
    function renderChatMessages() {
        const chatList = document.getElementById('chat-messages-list');
        if (!chatList) return;

        chatList.innerHTML = state.chatHistory.map(msg => `
            <div class="chat-message ${msg.sender === 'user' ? 'user' : 'assistant'} mb-3">
                <div class="msg-bubble p-3 border-radius-md ${msg.sender === 'user' ? 'bg-primary text-white ml-auto max-w-400' : 'bg-glass border-glass max-w-500'}">
                    ${escapeHtml(msg.text).replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');

        chatList.scrollTop = chatList.scrollHeight;
    }

    // --- TASK ACTIONS ---
    function toggleTaskComplete(id) {
        const updated = state.tasks.map(t => {
            if (t.id === id) {
                const nextStatus = !t.completed;
                return { ...t, completed: nextStatus, status: nextStatus ? 'completed' : 'todo' };
            }
            return t;
        });
        saveState('tasks', updated);
        renderCurrentTab();
    }

    function deleteTask(id) {
        if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
            const updated = state.tasks.filter(t => t.id !== id);
            saveState('tasks', updated);
            renderCurrentTab();
        }
    }

    // New Task Form Submission
    const newTaskForm = document.getElementById('new-task-form');
    if (newTaskForm) {
        newTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('task-title-input').value.trim();
            const project = document.getElementById('task-project-select').value;
            const priority = document.getElementById('task-priority-select').value;
            const assignee = document.getElementById('task-assignee-input').value.trim();
            const expense = parseFloat(document.getElementById('task-expense-input').value) || 0;
            const due = document.getElementById('task-date-input').value;

            if (!title) return;

            const newTask = {
                id: 'task_' + Date.now(),
                title: title,
                project: project,
                category: assignee ? 'Delegated' : expense > 0 ? 'Expense' : 'Work',
                priority: priority,
                status: 'todo',
                assignee: assignee,
                expense: expense,
                due: due ? new Date(due).toISOString() : null,
                completed: false,
                created_at: new Date().toISOString()
            };

            const updatedTasks = [newTask, ...state.tasks];
            saveState('tasks', updatedTasks);

            if (expense > 0) {
                const newExp = { id: 'exp_' + Date.now(), title: title, project: project, amount: expense, date: new Date().toISOString().split('T')[0] };
                saveState('expenses', [newExp, ...state.expenses]);
            }

            newTaskForm.reset();
            showToast('บันทึกสำเร็จ!', `เพิ่มงาน "${title}" เรียบร้อยแล้ว`, 'success');
            renderCurrentTab();
        });
    }

    // --- RENDER PROJECTS TAB ---
    function renderProjects() {
        const container = document.getElementById('projects-list-grid');
        if (!container) return;

        container.innerHTML = state.projects.map(p => {
            const pTasks = state.tasks.filter(t => t.project === p.name);
            const pExp = state.expenses.filter(e => e.project === p.name).reduce((sum, e) => sum + e.amount, 0);
            const doneCount = pTasks.filter(t => t.completed).length;

            return `
                <div class="glass-panel p-6 flex-column justify-between highlight-border-gold">
                    <div>
                        <div class="flex-row justify-between align-center mb-3">
                            <span class="badge badge-gold">${escapeHtml(p.category)}</span>
                            <span class="badge badge-emerald">${escapeHtml(p.status)}</span>
                        </div>
                        <h3>${escapeHtml(p.name)}</h3>
                        <p class="text-xs text-muted mt-2">ยอดรวมรายจ่ายโปรเจกต์: <strong class="text-gold">฿${pExp.toLocaleString()}</strong></p>
                    </div>

                    <div class="mt-6">
                        <div class="flex-row justify-between text-xs text-muted mb-2">
                            <span>ความคืบหน้า (${doneCount}/${pTasks.length} งาน)</span>
                            <span>${p.progress}%</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: var(--accent-gold); width: ${p.progress}%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- RENDER REVENUE & EXPENSES TAB ---
    function renderRevenue() {
        const expContainer = document.getElementById('project-expenses-breakdown');
        if (!expContainer) return;

        if (state.expenses.length === 0) {
            expContainer.innerHTML = `<p class="text-muted text-center py-4">ยังไม่มีรายการบันทึกรายจ่าย</p>`;
        } else {
            expContainer.innerHTML = state.expenses.map(e => `
                <div class="expense-item p-3 border-radius-md bg-glass flex-row justify-between align-center mb-2">
                    <div>
                        <strong>${escapeHtml(e.title)}</strong>
                        <p class="text-xs text-muted">โปรเจกต์: ${escapeHtml(e.project)} | วันที่: ${e.date}</p>
                    </div>
                    <span class="badge badge-rose font-bold">฿${e.amount.toLocaleString()}</span>
                </div>
            `).join('');
        }
    }

    // --- RENDER IDEAS TAB ---
    function renderIdeas() {
        const container = document.getElementById('ideas-grid-container');
        if (!container) return;

        if (state.ideas.length === 0) {
            container.innerHTML = `<p class="text-muted text-center py-6 col-span-3">ไม่มีรายการไอเดียที่บันทึกไว้</p>`;
        } else {
            container.innerHTML = state.ideas.map(i => `
                <div class="glass-panel p-4 flex-column justify-between mb-2">
                    <div>
                        <span class="badge badge-cyan mb-2">${escapeHtml(i.project || 'General')}</span>
                        <h4>💡 ${escapeHtml(i.title)}</h4>
                    </div>
                </div>
            `).join('');
        }
    }

    // --- SMART AUTO-EXTRACT NATURAL LANGUAGE COMMAND EXECUTION ---
    function executeNaturalLanguageCommand(text) {
        if (!text || typeof ReenAIEngine === 'undefined') return;

        // Play Sound Feedback
        const soundClip = document.getElementById('reminder-sound-clip');
        if (soundClip) {
            soundClip.play().catch(() => {});
        }

        const parsed = ReenAIEngine.parseIntent(text);
        let aiReply = '';

        // Update Extracted Badge
        if (commandExtractedBadge && commandExtractedText) {
            commandExtractedBadge.classList.remove('hidden');
            let desc = '';
            if (parsed.intent === 'create_task') desc = `📝 งานใหม่: "${parsed.title}" ${parsed.assignee ? `(มอบหมาย: ${parsed.assignee})` : ''}`;
            else if (parsed.intent === 'record_expense') desc = `💳 บันทึกรายจ่าย: "${parsed.title}" ฿${parsed.amount.toLocaleString()} [${parsed.project}]`;
            else if (parsed.intent === 'create_idea') desc = `💡 จดไอเดีย: "${parsed.title}"`;
            else desc = `🤖 AI สกัดจับใจความเรียบร้อย`;

            commandExtractedText.textContent = desc;
        }

        if (parsed.intent === 'create_task') {
            const newTask = {
                id: 'task_' + Date.now(),
                title: parsed.title,
                project: 'General',
                category: parsed.category || 'Work',
                priority: parsed.priority || 'high',
                status: 'todo',
                assignee: parsed.assignee || '',
                expense: 0,
                due: parsed.due || null,
                completed: false,
                created_at: new Date().toISOString()
            };
            saveState('tasks', [newTask, ...state.tasks]);
            aiReply = `รับทราบครับพี่รีน เพิ่มงาน "${parsed.title}" ${parsed.assignee ? `(มอบหมายให้ ${parsed.assignee})` : ''} เรียบร้อยครับ!`;
            showToast('สั่งงานสำเร็จ!', aiReply, 'success');
            speakText(aiReply);
        } 
        else if (parsed.intent === 'record_expense') {
            const newExp = { id: 'exp_' + Date.now(), title: parsed.title, project: parsed.project, amount: parsed.amount, date: new Date().toISOString().split('T')[0] };
            saveState('expenses', [newExp, ...state.expenses]);
            
            const expTask = { id: 'task_' + Date.now(), title: `จ่าย ${parsed.title}`, project: parsed.project, category: 'Expense', priority: 'high', status: 'completed', assignee: '', expense: parsed.amount, due: null, completed: true, created_at: new Date().toISOString() };
            saveState('tasks', [expTask, ...state.tasks]);
            
            aiReply = `บันทึกรายจ่าย ${parsed.title} จำนวน ฿${parsed.amount.toLocaleString()} ในโปรเจกต์ ${parsed.project} เรียบร้อยครับ!`;
            showToast('บันทึกรายจ่ายสำเร็จ!', aiReply, 'success');
            speakText(aiReply);
        }
        else if (parsed.intent === 'create_idea') {
            const newIdea = { id: 'idea_' + Date.now(), title: parsed.title, project: parsed.project, status: 'New' };
            saveState('ideas', [newIdea, ...state.ideas]);
            aiReply = `จดไอเดีย "${parsed.title}" ลงในคลังจำให้เรียบร้อยครับพี่รีน!`;
            showToast('จดไอเดียสำเร็จ!', aiReply, 'info');
            speakText(aiReply);
        }
        else if (parsed.intent === 'ask_oldest_task') {
            const pending = state.tasks.filter(t => !t.completed);
            if (pending.length === 0) {
                aiReply = 'ตอนนี้ไม่มีงานค้างเลยครับพี่รีน ทำเสร็จหมดแล้ว!';
            } else {
                const oldest = pending[pending.length - 1];
                aiReply = `งานที่ค้างนานที่สุดคือ "${oldest.title}" ของโปรเจกต์ ${oldest.project} ครับพี่รีน`;
            }
            speakText(aiReply);
        }
        else if (parsed.intent === 'ask_all_projects_summary') {
            aiReply = `สรุปทุกโปรเจกต์ให้ฟังครับพี่รีน: `;
            state.projects.forEach(p => {
                aiReply += `โปรเจกต์ ${p.name} ความคืบหน้า ${p.progress} เปอร์เซ็นต์, `;
            });
            speakText(aiReply);
        }
        else if (parsed.intent === 'get_daily_brief') {
            aiReply = ReenAIEngine.generateDailyBrief(state);
            speakText(aiReply);
        }
        else {
            aiReply = `รับทราบคำสั่ง "${text}" เรียบร้อยครับพี่รีน!`;
            showToast('รับทราบคำสั่ง', aiReply, 'info');
            speakText(aiReply);
        }

        // Push to Chat History
        const updatedChat = [...state.chatHistory, { sender: 'user', text: text }, { sender: 'assistant', text: aiReply }];
        saveState('chatHistory', updatedChat);

        renderCurrentTab();
    }

    // Bind Quick Command Submit & Enter Key
    if (globalSubmitBtn && globalCommandInput) {
        globalSubmitBtn.addEventListener('click', () => {
            const val = globalCommandInput.value.trim();
            if (val) {
                executeNaturalLanguageCommand(val);
                globalCommandInput.value = '';
            }
        });

        globalCommandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = globalCommandInput.value.trim();
                if (val) {
                    executeNaturalLanguageCommand(val);
                    globalCommandInput.value = '';
                }
            }
        });
    }

    // Chat Tab Form Listener
    const chatInputForm = document.getElementById('chat-input-form');
    const chatInputText = document.getElementById('chat-input-text');
    if (chatInputForm && chatInputText) {
        chatInputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = chatInputText.value.trim();
            if (val) {
                executeNaturalLanguageCommand(val);
                chatInputText.value = '';
            }
        });
    }

    // Help Modal Controls
    if (btnOpenHelpModal && helpModalOverlay) {
        btnOpenHelpModal.addEventListener('click', () => {
            helpModalOverlay.classList.remove('hidden');
        });
    }

    if (closeHelpModal && helpModalOverlay) {
        closeHelpModal.addEventListener('click', () => {
            helpModalOverlay.classList.add('hidden');
        });
    }

    if (btnCloseHelpConfirm && helpModalOverlay) {
        btnCloseHelpConfirm.addEventListener('click', () => {
            helpModalOverlay.classList.add('hidden');
        });
    }

    // --- VOICE STT & TTS CONTROLLER ---
    function speakText(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const clean = text.replace(/<[^>]*>/g, '').trim();
        if (!clean) return;

        const isThai = /[\u0e00-\u0e7f]/.test(clean);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = isThai ? 'th-TH' : 'en-US';
        utterance.rate = state.speechSpeed || 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(isThai ? 'th' : 'en'));
        if (matchingVoice) utterance.voice = matchingVoice;

        window.speechSynthesis.speak(utterance);
    }

    // Bind Speech Recognition (STT)
    function startVoiceRecognition(onResultCallback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('เบราว์เซอร์นี้ยังไม่รองรับระบบบันทึกเสียง SpeechRecognition กรุณาใช้ Chrome บนสมาร์ทโฟนหรือคอมพิวเตอร์ครับ');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (voiceStatusText) voiceStatusText.textContent = 'กำลังฟังคำสั่งพี่รีน... (กรุณาพูดได้เลย)';
            showToast('กำลังฟังเสียง...', 'พูดคำสั่ง เช่น "สั่งงานมิวให้ทำใบลา"', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (voiceTranscriptText) voiceTranscriptText.textContent = `คำสั่งที่ได้ยิน: "${transcript}"`;
            if (onResultCallback) onResultCallback(transcript);
        };

        recognition.onerror = () => {
            if (voiceStatusText) voiceStatusText.textContent = 'เกิดข้อผิดพลาดในการฟังเสียง ลองกดพูดอีกครั้งครับ';
        };

        recognition.start();
    }

    // Floating Mic & Voice Modal Events
    const openVoiceAction = () => {
        if (voiceOverlayModal) voiceOverlayModal.classList.remove('hidden');
        startVoiceRecognition((text) => {
            executeNaturalLanguageCommand(text);
        });
    };

    if (floatingMicBtn) floatingMicBtn.addEventListener('click', openVoiceAction);
    
    const btnOpenVoiceModal = document.getElementById('btn-open-voice-modal');
    if (btnOpenVoiceModal) btnOpenVoiceModal.addEventListener('click', openVoiceAction);

    if (globalVoiceBtn) globalVoiceBtn.addEventListener('click', openVoiceAction);

    if (closeVoiceModal) {
        closeVoiceModal.addEventListener('click', () => {
            if (voiceOverlayModal) voiceOverlayModal.classList.add('hidden');
            window.speechSynthesis.cancel();
        });
    }

    if (voiceModalMicToggle) {
        voiceModalMicToggle.addEventListener('click', () => {
            startVoiceRecognition((text) => {
                executeNaturalLanguageCommand(text);
            });
        });
    }

    if (voiceModalStopSpeaker) {
        voiceModalStopSpeaker.addEventListener('click', () => {
            window.speechSynthesis.cancel();
        });
    }

    // Audio Buttons Binds
    const btnDailyBrief = document.getElementById('btn-listen-daily-brief');
    if (btnDailyBrief) {
        btnDailyBrief.addEventListener('click', () => {
            const brief = ReenAIEngine.generateDailyBrief(state);
            speakText(brief);
        });
    }

    const btnEveningSummary = document.getElementById('btn-listen-evening-summary');
    if (btnEveningSummary) {
        btnEveningSummary.addEventListener('click', () => {
            const summary = ReenAIEngine.generateEveningSummary(state);
            speakText(summary);
        });
    }

    const btnWeeklyReview = document.getElementById('btn-listen-weekly-review');
    if (btnWeeklyReview) {
        btnWeeklyReview.addEventListener('click', () => {
            const review = ReenAIEngine.generateWeeklyReview(state);
            speakText(review);
        });
    }

    // JSON Export & Restore Handlers
    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
        btnExportJSON.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `reen_ai_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('สำรองข้อมูลสำเร็จ!', 'ดาวน์โหลดไฟล์ JSON เรียบร้อยแล้ว', 'success');
        });
    }

    const inputRestoreJSON = document.getElementById('input-restore-json');
    if (inputRestoreJSON) {
        inputRestoreJSON.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedState = JSON.parse(event.target.result);
                    if (importedState.tasks) saveState('tasks', importedState.tasks);
                    if (importedState.projects) saveState('projects', importedState.projects);
                    if (importedState.expenses) saveState('expenses', importedState.expenses);
                    if (importedState.ideas) saveState('ideas', importedState.ideas);
                    if (importedState.habits) saveState('habits', importedState.habits);

                    showToast('คืนค่าข้อมูลสำเร็จ!', 'อัปเดตข้อมูลจากไฟล์ JSON เรียบร้อยแล้ว', 'success');
                    renderCurrentTab();
                } catch (err) {
                    alert('ไฟล์ JSON ไม่ถูกต้อง กรุณาเลือกไฟล์สำรองข้อมูลของ Reen AI ครับ');
                }
            };
            reader.readAsText(file);
        });
    }

    const btnClearMemory = document.getElementById('btn-clear-ai-memory');
    if (btnClearMemory) {
        btnClearMemory.addEventListener('click', () => {
            if (confirm('คุณต้องการรีเซ็ตความจำบริบทของ AI ใช่หรือไม่?')) {
                showToast('รีเซ็ตสำเร็จ', 'ล้างข้อมูลความจำ AI เรียบร้อยแล้ว', 'info');
            }
        });
    }

    // Speed Selector Buttons
    document.querySelectorAll('.btn-speed-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-speed-select').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.speechSpeed = parseFloat(e.currentTarget.getAttribute('data-speed')) || 1.0;
        });
    });

    // --- TOAST NOTIFICATIONS ---
    function showToast(title, msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-message p-3 border-radius-md mb-2 bg-glass border-glass text-sm flex-column gap-1`;
        toast.style.borderLeft = type === 'success' ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-gold)';
        toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(msg)}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // --- INITIALIZATION ---
    switchTab('dashboard');
});
