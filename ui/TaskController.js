import { Utils } from '../utils.js';

export class TaskController {
    constructor(app) {
        this.app = app;
        this.selector = document.getElementById('task-selector');
        // this.validateBtn removed in favor of Compile/Play hooks
        this.statusTab = document.querySelector('.bottom-tab[data-tab="task-status"]');
        this.statusContent = document.getElementById('task-status-content');
        this.compilerResults = document.getElementById('compiler-results');

        this.taskTitle = document.getElementById('task-title');
        this.taskDesc = document.getElementById('task-desc');
        this.requirementsList = document.getElementById('task-requirements');

        this.init();
    }

    init() {
        this.populateTaskSelector();
        this.bindEvents();
    }

    populateTaskSelector() {
        const tasks = this.app.taskManager.getAllTasks();
        this.selector.innerHTML = '<option value="">Select Task...</option>';

        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.taskId;
            option.textContent = `${task.level ? `Level ${task.level}: ` : ''}${task.title}`;
            this.selector.appendChild(option);
        });
    }

    bindEvents() {
        // Task Selection
        this.selector.addEventListener('change', (e) => {
            const taskId = e.target.value;
            if (taskId) {
                this.app.taskManager.setCurrentTask(taskId);
                this.updateStatusPanel();
                this.switchToStatusTab();
            } else {
                this.app.taskManager.clearTask();
                this.updateStatusPanel();
            }
        });

        this.compileBtn = document.getElementById('compile-btn');
        this.playBtn = document.getElementById('play-btn');

        // Hook into Compile and Play for Validation
        this.compileBtn.addEventListener('click', () => this.runValidation());
        this.playBtn.addEventListener('click', () => this.runValidation());
        // Tab Switching Logic (handling the new tab)
        document.querySelectorAll('.bottom-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all
                document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel-content').forEach(c => {
                    if (c.parentElement.id === 'bottom-strip') c.style.display = 'none';
                });

                // Activate clicked
                tab.classList.add('active');
                const tabId = tab.dataset.tab;

                if (tabId === 'task-status') {
                    this.statusContent.style.display = 'block';
                } else if (tabId === 'compiler') {
                    this.compilerResults.style.display = 'block';
                } else {
                    // Find results placeholder
                    const findResults = document.getElementById('find-results') || document.createElement('div'); // Fallback
                    findResults.style.display = 'block';
                }
            });
        });
    }

    runValidation() {
        // Only validate if a task is active
        if (this.app.taskManager.getCurrentTask()) {
            const results = this.app.taskManager.validateCurrentTask();
            this.updateStatusPanel(results);
            this.switchToStatusTab();
        }
    }

    switchToStatusTab() {
        // Simulate click on the status tab
        if (this.statusTab) this.statusTab.click();
    }

    updateStatusPanel(validationResults = null) {
        const task = this.app.taskManager.getCurrentTask();

        if (!task) {
            this.taskTitle.textContent = "No Active Task";
            this.taskDesc.textContent = "Select a task from the toolbar to begin.";
            this.requirementsList.innerHTML = '';
            return;
        }

        this.taskTitle.textContent = task.title;
        this.taskDesc.textContent = task.description;
        this.requirementsList.innerHTML = '';

        // If we have validation results, show them. Otherwise show requirements as unchecked.
        const results = validationResults ? validationResults.results : null;

        task.requirements.forEach((req, index) => {
            const result = results ? results[index] : null;
            const isPassed = result ? result.passed : false;

            const item = document.createElement('div');
            item.style.padding = '8px';
            item.style.borderBottom = '1px solid #333';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.color = isPassed ? '#4caf50' : '#ccc';

            const icon = document.createElement('i');
            icon.className = isPassed ? 'fas fa-check-circle' : 'far fa-circle';
            icon.style.marginRight = '10px';

            const text = document.createElement('span');
            text.textContent = req.description;

            item.appendChild(icon);
            item.appendChild(text);
            this.requirementsList.appendChild(item);
        });

        if (validationResults && validationResults.success) {
            const successMsg = document.createElement('div');
            successMsg.style.marginTop = '15px';
            successMsg.style.padding = '10px';
            successMsg.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            successMsg.style.border = '1px solid #4caf50';
            successMsg.style.borderRadius = '4px';
            successMsg.style.color = '#4caf50';
            successMsg.style.textAlign = 'center';
            successMsg.innerHTML = '<strong><i class="fas fa-trophy"></i> Task Complete!</strong>';
            this.requirementsList.appendChild(successMsg);
        }
    }
}
