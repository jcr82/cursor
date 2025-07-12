class PersonalizedChatApp {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.apiKey = localStorage.getItem('personalDataApiKey') || '';
        this.settings = {
            autoContext: true,
            showDataUsed: true
        };
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSettings();
        this.checkSystemStatus();
        this.updateTimestamp();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.notificationContainer = document.getElementById('notificationContainer');
        
        // Navigation elements
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Status elements
        this.aiStatus = document.getElementById('aiStatus');
        this.dataStatus = document.getElementById('dataStatus');
        
        // Chat controls
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.contextToggle = document.getElementById('contextToggle');
        
        // Personal data elements
        this.loadDataBtn = document.getElementById('loadDataBtn');
        this.saveDataBtn = document.getElementById('saveDataBtn');
        
        // Settings elements
        this.apiKeyInput = document.getElementById('api-key');
        this.testApiBtn = document.getElementById('testApiBtn');
        this.autoContextCheckbox = document.getElementById('autoContext');
        this.showDataUsedCheckbox = document.getElementById('showDataUsed');
        this.systemInfo = document.getElementById('systemInfo');
        this.refreshInfoBtn = document.getElementById('refreshInfoBtn');
    }

    initializeEventListeners() {
        // Navigation
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Chat functionality
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Chat controls
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.contextToggle.addEventListener('click', () => this.toggleContext());

        // Suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.messageInput.value = e.target.textContent;
                this.sendMessage();
            });
        });

        // Personal data management
        this.loadDataBtn.addEventListener('click', () => this.loadPersonalData());
        this.saveDataBtn.addEventListener('click', () => this.savePersonalData());

        // Settings
        this.apiKeyInput.addEventListener('change', () => this.updateApiKey());
        this.testApiBtn.addEventListener('click', () => this.testApiConnection());
        this.autoContextCheckbox.addEventListener('change', () => this.updateSettings());
        this.showDataUsedCheckbox.addEventListener('change', () => this.updateSettings());
        this.refreshInfoBtn.addEventListener('click', () => this.refreshSystemInfo());

        // Section toggles
        document.querySelectorAll('.section-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleSection(e.target.closest('.section-card')));
        });
    }

    initializeSettings() {
        this.autoContextCheckbox.checked = this.settings.autoContext;
        this.showDataUsedCheckbox.checked = this.settings.showDataUsed;
        this.apiKeyInput.value = this.apiKey;
    }

    // Tab Management
    switchTab(tabName) {
        // Update navigation
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        this.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Load data if switching to profile tab
        if (tabName === 'profile') {
            this.loadPersonalData();
        } else if (tabName === 'settings') {
            this.refreshSystemInfo();
        }
    }

    toggleSection(sectionCard) {
        const content = sectionCard.querySelector('.section-content');
        const toggle = sectionCard.querySelector('.section-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▼';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▶';
        }
    }

    // Chat Functionality
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.addMessage(message, 'user');
        this.showLoading('Thinking...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    sessionId: this.sessionId,
                    includePersonalContext: this.settings.autoContext
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.hideLoading();
            
            this.addMessage(data.response, 'ai', {
                personalDataUsed: data.personalDataUsed,
                contextLength: data.contextLength,
                isDemo: data.isDemo
            });

        } catch (error) {
            console.error('Error:', error);
            this.hideLoading();
            this.addMessage(
                'Sorry, I encountered an error while processing your message. Please try again.',
                'ai'
            );
            this.showNotification('Error sending message', 'error');
        }
    }

    addMessage(content, type, metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (type === 'user') {
            messageContent.innerHTML = `<strong>You:</strong> ${this.escapeHtml(content)}`;
        } else {
            messageContent.innerHTML = `<strong>AI Assistant:</strong> ${this.formatResponse(content)}`;
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);

        // Add metadata for AI messages
        if (type === 'ai' && this.settings.showDataUsed) {
            const messageMeta = document.createElement('div');
            messageMeta.className = 'message-meta';
            
            if (metadata.personalDataUsed) {
                const contextIndicator = document.createElement('span');
                contextIndicator.className = 'context-indicator';
                contextIndicator.title = 'Used personal context';
                contextIndicator.textContent = '🧠';
                messageMeta.appendChild(contextIndicator);
            }
            
            if (metadata.isDemo) {
                const demoIndicator = document.createElement('span');
                demoIndicator.className = 'demo-indicator';
                demoIndicator.title = 'Demo mode - configure Gemini API key';
                demoIndicator.textContent = '🔧';
                messageMeta.appendChild(demoIndicator);
            }
            
            messageDiv.appendChild(messageMeta);
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    clearChat() {
        // Clear chat UI
        const aiWelcomeMessage = this.chatMessages.querySelector('.ai-message').cloneNode(true);
        this.chatMessages.innerHTML = '';
        this.chatMessages.appendChild(aiWelcomeMessage);
        
        // Clear server-side context
        fetch('/api/chat/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: this.sessionId, action: 'clear' })
        }).catch(console.error);
        
        this.showNotification('Chat cleared', 'success');
    }

    toggleContext() {
        this.settings.autoContext = !this.settings.autoContext;
        const toggle = this.contextToggle;
        const text = toggle.querySelector('.toggle-text');
        
        if (this.settings.autoContext) {
            toggle.classList.add('active');
            text.textContent = 'Personal Context: ON';
        } else {
            toggle.classList.remove('active');
            text.textContent = 'Personal Context: OFF';
        }
        
        this.showNotification(
            `Personal context ${this.settings.autoContext ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    // Personal Data Management
    async loadPersonalData() {
        this.showLoading('Loading personal data...');
        
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.apiKey) headers['X-API-Key'] = this.apiKey;
            
            const response = await fetch('/api/personal-data', { headers });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.populatePersonalDataForm(result.data);
            this.updateDataStatus(true);
            this.showNotification('Personal data loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading personal data:', error);
            this.updateDataStatus(false);
            this.showNotification('Failed to load personal data', 'error');
        }
        
        this.hideLoading();
    }

    async savePersonalData() {
        this.showLoading('Saving personal data...');
        
        try {
            const data = this.collectPersonalDataFromForm();
            
            const headers = { 'Content-Type': 'application/json' };
            if (this.apiKey) headers['X-API-Key'] = this.apiKey;
            
            const response = await fetch('/api/personal-data', {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.updateDataStatus(true);
            this.showNotification('Personal data saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving personal data:', error);
            this.showNotification('Failed to save personal data', 'error');
        }
        
        this.hideLoading();
    }

    populatePersonalDataForm(data) {
        if (!data) return;
        
        // Biography
        if (data.biography) {
            document.getElementById('bio-name').value = data.biography.name || '';
            document.getElementById('bio-title').value = data.biography.title || '';
            document.getElementById('bio-description').value = data.biography.description || '';
            document.getElementById('bio-location').value = data.biography.location || '';
        }
        
        // Skills
        this.populateSkillsList(data.skills || []);
        
        // Projects
        this.populateProjectsList(data.projects || []);
        
        // Experience
        this.populateExperienceList(data.experience || []);
    }

    collectPersonalDataFromForm() {
        return {
            biography: {
                name: document.getElementById('bio-name').value,
                title: document.getElementById('bio-title').value,
                description: document.getElementById('bio-description').value,
                location: document.getElementById('bio-location').value
            },
            skills: this.collectSkillsFromForm(),
            projects: this.collectProjectsFromForm(),
            experience: this.collectExperienceFromForm()
        };
    }

    populateSkillsList(skills) {
        const container = document.getElementById('skillsList');
        container.innerHTML = '';
        
        skills.forEach(skill => {
            const skillDiv = this.createSkillItem(skill);
            container.appendChild(skillDiv);
        });
    }

    createSkillItem(skill = {}) {
        const div = document.createElement('div');
        div.className = 'skill-item';
        div.innerHTML = `
            <input type="text" placeholder="Skill name" value="${skill.name || ''}" data-field="name">
            <select data-field="category">
                <option value="programming" ${skill.category === 'programming' ? 'selected' : ''}>Programming</option>
                <option value="tools" ${skill.category === 'tools' ? 'selected' : ''}>Tools</option>
                <option value="soft-skills" ${skill.category === 'soft-skills' ? 'selected' : ''}>Soft Skills</option>
            </select>
            <select data-field="proficiency">
                <option value="beginner" ${skill.proficiency === 'beginner' ? 'selected' : ''}>Beginner</option>
                <option value="intermediate" ${skill.proficiency === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="advanced" ${skill.proficiency === 'advanced' ? 'selected' : ''}>Advanced</option>
                <option value="expert" ${skill.proficiency === 'expert' ? 'selected' : ''}>Expert</option>
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
        `;
        return div;
    }

    collectSkillsFromForm() {
        const skills = [];
        document.querySelectorAll('.skill-item').forEach(item => {
            const name = item.querySelector('[data-field="name"]').value;
            if (name.trim()) {
                skills.push({
                    name: name.trim(),
                    category: item.querySelector('[data-field="category"]').value,
                    proficiency: item.querySelector('[data-field="proficiency"]').value
                });
            }
        });
        return skills;
    }

    populateProjectsList(projects) {
        const container = document.getElementById('projectsList');
        container.innerHTML = '';
        
        projects.forEach(project => {
            const projectDiv = this.createProjectItem(project);
            container.appendChild(projectDiv);
        });
    }

    createProjectItem(project = {}) {
        const div = document.createElement('div');
        div.className = 'project-item';
        div.innerHTML = `
            <input type="text" placeholder="Project name" value="${project.name || ''}" data-field="name">
            <textarea placeholder="Description" data-field="description">${project.description || ''}</textarea>
            <input type="text" placeholder="Technologies (comma-separated)" value="${(project.technologies || []).join(', ')}" data-field="technologies">
            <select data-field="status">
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="in-progress" ${project.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="planned" ${project.status === 'planned' ? 'selected' : ''}>Planned</option>
                <option value="archived" ${project.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
        `;
        return div;
    }

    collectProjectsFromForm() {
        const projects = [];
        document.querySelectorAll('.project-item').forEach(item => {
            const name = item.querySelector('[data-field="name"]').value;
            if (name.trim()) {
                const technologies = item.querySelector('[data-field="technologies"]').value
                    .split(',').map(t => t.trim()).filter(t => t);
                
                projects.push({
                    name: name.trim(),
                    description: item.querySelector('[data-field="description"]').value.trim(),
                    technologies,
                    status: item.querySelector('[data-field="status"]').value
                });
            }
        });
        return projects;
    }

    populateExperienceList(experience) {
        const container = document.getElementById('experienceList');
        container.innerHTML = '';
        
        experience.forEach(exp => {
            const expDiv = this.createExperienceItem(exp);
            container.appendChild(expDiv);
        });
    }

    createExperienceItem(exp = {}) {
        const div = document.createElement('div');
        div.className = 'experience-item';
        div.innerHTML = `
            <input type="text" placeholder="Company" value="${exp.company || ''}" data-field="company">
            <input type="text" placeholder="Position" value="${exp.position || ''}" data-field="position">
            <textarea placeholder="Description" data-field="description">${exp.description || ''}</textarea>
            <label>
                <input type="checkbox" data-field="isCurrent" ${exp.isCurrent ? 'checked' : ''}>
                Current position
            </label>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
        `;
        return div;
    }

    collectExperienceFromForm() {
        const experience = [];
        document.querySelectorAll('.experience-item').forEach(item => {
            const company = item.querySelector('[data-field="company"]').value;
            if (company.trim()) {
                experience.push({
                    company: company.trim(),
                    position: item.querySelector('[data-field="position"]').value.trim(),
                    description: item.querySelector('[data-field="description"]').value.trim(),
                    isCurrent: item.querySelector('[data-field="isCurrent"]').checked
                });
            }
        });
        return experience;
    }

    // Settings Management
    updateApiKey() {
        this.apiKey = this.apiKeyInput.value;
        localStorage.setItem('personalDataApiKey', this.apiKey);
        this.showNotification('API key updated', 'info');
    }

    async testApiConnection() {
        this.showLoading('Testing API connection...');
        
        try {
            const headers = {};
            if (this.apiKey) headers['X-API-Key'] = this.apiKey;
            
            const response = await fetch('/api/personal-data/health', { headers });
            
            if (response.ok) {
                this.showNotification('API connection successful', 'success');
                this.updateDataStatus(true);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            this.showNotification('API connection failed', 'error');
            this.updateDataStatus(false);
        }
        
        this.hideLoading();
    }

    updateSettings() {
        this.settings.autoContext = this.autoContextCheckbox.checked;
        this.settings.showDataUsed = this.showDataUsedCheckbox.checked;
        this.showNotification('Settings updated', 'info');
    }

    async refreshSystemInfo() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            this.systemInfo.innerHTML = `
                <div class="system-info-grid">
                    <div><strong>Status:</strong> ${health.status}</div>
                    <div><strong>Version:</strong> ${health.version}</div>
                    <div><strong>Environment:</strong> ${health.configuration.environment}</div>
                    <div><strong>Gemini AI:</strong> ${health.services.geminiAI}</div>
                    <div><strong>Uptime:</strong> ${Math.floor(health.uptime / 60)} minutes</div>
                    <div><strong>Memory Usage:</strong> ${Math.round(health.memory.used / 1024 / 1024)}MB</div>
                </div>
            `;
            
            this.updateAiStatus(health.configuration.hasGeminiKey);
            
        } catch (error) {
            this.systemInfo.innerHTML = '<p>Failed to load system information</p>';
        }
    }

    // Status Management
    updateAiStatus(isConfigured) {
        const dot = this.aiStatus.querySelector('.status-dot');
        const text = this.aiStatus.querySelector('.status-text');
        
        if (isConfigured) {
            dot.className = 'status-dot status-success';
            text.textContent = 'AI Ready';
        } else {
            dot.className = 'status-dot status-warning';
            text.textContent = 'AI Config Needed';
        }
    }

    updateDataStatus(isHealthy) {
        const dot = this.dataStatus.querySelector('.status-dot');
        const text = this.dataStatus.querySelector('.status-text');
        
        if (isHealthy) {
            dot.className = 'status-dot status-success';
            text.textContent = 'Data Available';
        } else {
            dot.className = 'status-dot status-error';
            text.textContent = 'Data Unavailable';
        }
    }

    async checkSystemStatus() {
        await this.refreshSystemInfo();
        await this.testApiConnection();
    }

    // UI Helpers
    showLoading(text = 'Loading...') {
        this.loadingText.textContent = text;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    formatResponse(content) {
        return this.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateTimestamp() {
        const timeElements = document.querySelectorAll('.message-time');
        timeElements.forEach(element => {
            if (!element.textContent) {
                element.textContent = new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new PersonalizedChatApp();
    
    // Setup add buttons for dynamic content
    document.getElementById('addSkillBtn').addEventListener('click', () => {
        const container = document.getElementById('skillsList');
        container.appendChild(window.chatApp.createSkillItem());
    });
    
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        const container = document.getElementById('projectsList');
        container.appendChild(window.chatApp.createProjectItem());
    });
    
    document.getElementById('addExperienceBtn').addEventListener('click', () => {
        const container = document.getElementById('experienceList');
        container.appendChild(window.chatApp.createExperienceItem());
    });
});