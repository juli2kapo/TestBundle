// bundle.mjs - Standalone injectable chat widget
(function() {
    'use strict';
    
    // Configuration object that will be set by the parent page
    let config = {
        botId: null,
        apiUrl: 'https://bots.elykia.com.ar',
        theme: 'light',
        position: 'bottom-right',
        botName: 'Nova Assistant',
        welcomeMessage: "Hi there! 👋 I'm Nova, your AI assistant. How can I help you today?",
        quickActions: ['Help Center', 'Account Info']
    };

    class ModernChatWidget {
        constructor(userConfig = {}) {
            // Merge user config with defaults
            this.config = { ...config, ...userConfig };
            this.isOpen = false;
            this.messages = [];
            this.isInitialized = false;
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            
            this.injectStyles();
            this.createWidget();
            this.bindEvents();
        }

        injectStyles() {
    // Check if styles are already injected
    if (document.getElementById('elykia-chat-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'elykia-chat-styles';
    style.type = 'text/css';
    
    // Import Inter font if not already available
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    fontLink.rel = 'stylesheet';
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
        document.head.appendChild(fontLink);
    }

    style.textContent = `
        /* Reset and base styles for chat widget */
        #elykia-chat-widget {
            all: initial !important;
            position: fixed !important;
            ${this.config.position === 'bottom-left' ? 'left: 1.5rem !important;' : 'right: 1.5rem !important;'}
            bottom: 1.5rem !important;
            z-index: 2147483647 !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            color: #000 !important;
            direction: ltr !important;
        }

        #elykia-chat-widget *,
        #elykia-chat-widget *::before,
        #elykia-chat-widget *::after {
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            font: inherit !important;
            vertical-align: baseline !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
        }

        /* Chat toggle button */
        #elykia-chat-widget .elykia-chat-toggle {
            width: 48px !important;
            height: 48px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%) !important;
            border: none !important;
            cursor: pointer !important;
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
        }

        #elykia-chat-widget .elykia-chat-toggle:hover {
            transform: translateY(-2px) scale(1.05) !important;
            box-shadow: 0 8px 25px rgba(14, 165, 233, 0.45) !important;
        }

        #elykia-chat-widget .elykia-chat-toggle svg {
            width: 20px !important;
            height: 20px !important;
            color: white !important;
            transition: all 0.3s ease !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 2 !important;
        }

        #elykia-chat-widget .elykia-chat-toggle .elykia-close-icon {
            position: absolute !important;
            opacity: 0 !important;
            transform: rotate(90deg) !important;
        }

        #elykia-chat-widget .elykia-chat-toggle.active .elykia-chat-icon {
            opacity: 0 !important;
            transform: rotate(-90deg) !important;
        }

        #elykia-chat-widget .elykia-chat-toggle.active .elykia-close-icon {
            opacity: 1 !important;
            transform: rotate(0deg) !important;
        }

        /* Chat window */
        #elykia-chat-widget .elykia-chat-window {
            position: absolute !important;
            bottom: 60px !important;
            ${this.config.position === 'bottom-left' ? 'left: 0 !important;' : 'right: 0 !important;'}
            width: 340px !important;
            height: 460px !important;
            background: white !important;
            border-radius: 18px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02) !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            opacity: 0 !important;
            transform: translateY(15px) scale(0.95) !important;
            visibility: hidden !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        #elykia-chat-widget .elykia-chat-window.active {
            opacity: 1 !important;
            transform: translateY(0) scale(1) !important;
            visibility: visible !important;
        }

        /* Chat header */
        #elykia-chat-widget .elykia-chat-header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%) !important;
            padding: 1rem 1.25rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            color: white !important;
            position: relative !important;
            z-index: 10 !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05) !important;
        }

        #elykia-chat-widget .elykia-header-content {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
        }

        #elykia-chat-widget .elykia-avatar {
            width: 34px !important;
            height: 34px !important;
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        #elykia-chat-widget .elykia-avatar svg {
            width: 16px !important;
            height: 16px !important;
            color: white !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.5 !important;
        }

        #elykia-chat-widget .elykia-header-info h3 {
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            margin-bottom: 0.15rem !important;
            letter-spacing: -0.2px !important;
            color: white !important;
        }

        #elykia-chat-widget .elykia-status {
            font-size: 0.75rem !important;
            opacity: 0.9 !important;
            font-weight: 400 !important;
            color: white !important;
        }

        #elykia-chat-widget .elykia-minimize-btn {
            background: none !important;
            border: none !important;
            color: white !important;
            cursor: pointer !important;
            padding: 0.4rem !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
        }

        #elykia-chat-widget .elykia-minimize-btn:hover {
            background: rgba(255, 255, 255, 0.15) !important;
        }

        #elykia-chat-widget .elykia-minimize-btn svg {
            width: 18px !important;
            height: 18px !important;
            color: white !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 2 !important;
        }

        /* Messages container */
        #elykia-chat-widget .elykia-messages-container {
            flex: 1 !important;
            padding: 1.25rem !important;
            overflow-y: auto !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.8rem !important;
            background: #fafcff !important;
        }

        #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar {
            width: 5px !important;
        }

        #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar-thumb {
            background: #dbeafe !important;
            border-radius: 3px !important;
        }

        #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar-track {
            background: rgba(219, 234, 254, 0.3) !important;
        }

        /* Welcome message */
        #elykia-chat-widget .elykia-welcome-message {
            display: flex !important;
            gap: 0.8rem !important;
            align-items: flex-start !important;
        }

        #elykia-chat-widget .elykia-bot-avatar {
            width: 32px !important;
            height: 32px !important;
            background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2) !important;
        }

        #elykia-chat-widget .elykia-bot-avatar svg {
            width: 16px !important;
            height: 16px !important;
            color: white !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.5 !important;
        }

        #elykia-chat-widget .elykia-message-content {
            flex: 1 !important;
        }

        #elykia-chat-widget .elykia-message-content p {
            background: white !important;
            padding: 0.8rem 1.1rem !important;
            border-radius: 14px 14px 14px 4px !important;
            margin-bottom: 0.8rem !important;
            color: #1e293b !important;
            line-height: 1.45 !important;
            font-size: 0.9rem !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03) !important;
        }

        /* Quick actions */
        #elykia-chat-widget .elykia-quick-actions {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.4rem !important;
        }

        #elykia-chat-widget .elykia-quick-btn {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            padding: 0.4rem 0.8rem !important;
            border-radius: 16px !important;
            font-size: 0.8rem !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            color: #334155 !important;
            font-weight: 500 !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
        }

        #elykia-chat-widget .elykia-quick-btn:hover {
            border-color: #bae6fd !important;
            background: #f0f9ff !important;
            color: #0c4a6e !important;
            transform: translateY(-1px) !important;
        }

        /* Message bubbles */
        #elykia-chat-widget .elykia-message {
            display: flex !important;
            gap: 0.8rem !important;
            margin-bottom: 0.8rem !important;
            animation: elykiaFadeIn 0.3s ease-out !important;
        }

        #elykia-chat-widget .elykia-message.user {
            flex-direction: row-reverse !important;
        }

        #elykia-chat-widget .elykia-message.user .elykia-message-bubble {
            background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%) !important;
            color: white !important;
            border-radius: 14px 14px 4px 14px !important;
            box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2) !important;
        }

        #elykia-chat-widget .elykia-message.bot .elykia-message-bubble {
            background: white !important;
            color: #1e293b !important;
            border-radius: 14px 14px 14px 4px !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03) !important;
        }

        #elykia-chat-widget .elykia-message-bubble {
            max-width: 80% !important;
            padding: 0.8rem 1.1rem !important;
            line-height: 1.45 !important;
            font-size: 0.9rem !important;
            transition: all 0.2s ease !important;
        }

        /* Typing indicator */
        #elykia-chat-widget .elykia-typing-indicator {
            display: flex !important;
            align-items: center !important;
            gap: 0.8rem !important;
            padding: 0 1.25rem 0.8rem !important;
            color: #64748b !important;
            font-size: 0.8rem !important;
        }

        #elykia-chat-widget .elykia-typing-dots {
            display: flex !important;
            gap: 4px !important;
        }

        #elykia-chat-widget .elykia-typing-dots span {
            width: 5px !important;
            height: 5px !important;
            background: #94a3b8 !important;
            border-radius: 50% !important;
            animation: elykiaTyping 1.4s infinite !important;
        }

        #elykia-chat-widget .elykia-typing-dots span:nth-child(2) {
            animation-delay: 0.2s !important;
        }

        #elykia-chat-widget .elykia-typing-dots span:nth-child(3) {
            animation-delay: 0.4s !important;
        }

        /* Input container */
        #elykia-chat-widget .elykia-input-container {
            padding: 1rem !important;
            border-top: 1px solid #f1f5f9 !important;
            background: white !important;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02) !important;
        }

        #elykia-chat-widget .elykia-input-wrapper {
            display: flex !important;
            gap: 0.6rem !important;
            align-items: flex-end !important;
        }

        #elykia-chat-widget .elykia-message-input {
            flex: 1 !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 18px !important;
            padding: 0.7rem 1.1rem !important;
            font-size: 0.9rem !important;
            resize: none !important;
            outline: none !important;
            transition: all 0.2s ease !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            background: #f8fafc !important;
            color: #1e293b !important;
        }

        #elykia-chat-widget .elykia-message-input:focus {
            border-color: #bae6fd !important;
            background: white !important;
            box-shadow: 0 0 0 3px rgba(186, 230, 253, 0.3) !important;
        }

        #elykia-chat-widget .elykia-message-input::placeholder {
            color: #94a3b8 !important;
        }

        #elykia-chat-widget .elykia-send-btn {
            width: 40px !important;
            height: 40px !important;
            background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%) !important;
            border: none !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
        }

        #elykia-chat-widget .elykia-send-btn:hover:not(:disabled) {
            transform: scale(1.05) !important;
            box-shadow: 0 3px 8px rgba(14, 165, 233, 0.3) !important;
        }

        #elykia-chat-widget .elykia-send-btn:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
        }

        #elykia-chat-widget .elykia-send-btn svg {
            width: 18px !important;
            height: 18px !important;
            color: white !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.8 !important;
        }

        #elykia-chat-widget .elykia-input-footer {
            display: flex !important;
            justify-content: flex-end !important;
            margin-top: 0.4rem !important;
        }

        #elykia-chat-widget .elykia-char-count {
            font-size: 0.7rem !important;
            color: #94a3b8 !important;
        }

        /* Animations */
        @keyframes elykiaTyping {
            0%, 60%, 100% {
                transform: scale(1) !important;
                opacity: 0.5 !important;
            }
            30% {
                transform: scale(1.2) !important;
                opacity: 1 !important;
            }
        }
        
        @keyframes elykiaFadeIn {
            from {
                opacity: 0 !important;
                transform: translateY(5px) !important;
            }
            to {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
            #elykia-chat-widget {
                bottom: 1rem !important;
                ${this.config.position === 'bottom-left' ? 'left: 1rem !important;' : 'right: 1rem !important;'}
            }

            #elykia-chat-widget .elykia-chat-window {
                width: calc(100vw - 2rem) !important;
                height: calc(100vh - 120px) !important;
                bottom: 60px !important;
                ${this.config.position === 'bottom-left' ? 'left: 0 !important;' : 'right: 0 !important;'}
            }
        }
    `;
    
    document.head.appendChild(style);
}

        createWidget() {
            // Remove existing widget if any
            const existingWidget = document.getElementById('elykia-chat-widget');
            if (existingWidget) {
                existingWidget.remove();
            }

            const widget = document.createElement('div');
            widget.id = 'elykia-chat-widget';
            widget.innerHTML = `
                <button class="elykia-chat-toggle">
                    <svg class="elykia-chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <svg class="elykia-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div class="elykia-chat-window">
                    <div class="elykia-chat-header">
                        <div class="elykia-header-content">
                            <div class="elykia-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div class="elykia-header-info">
                                <h3>${this.config.botName}</h3>
                                <span class="elykia-status">Available now</span>
                            </div>
                        </div>
                        <button class="elykia-minimize-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="elykia-messages-container">
                        <div class="elykia-welcome-message">
                            <div class="elykia-bot-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/>
                                </svg>
                            </div>
                            <div class="elykia-message-content">
                                <p>${this.config.welcomeMessage}</p>
                                <div class="elykia-quick-actions">
                                    ${this.config.quickActions.map(action => 
                                        `<button class="elykia-quick-btn">${action}</button>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="elykia-typing-indicator" style="display: none;">
                        <div class="elykia-typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>${this.config.botName} is thinking...</span>
                    </div>

                    <div class="elykia-input-container">
                        <div class="elykia-input-wrapper">
                            <input type="text" class="elykia-message-input" placeholder="Message ${this.config.botName}..." maxlength="500">
                            <button class="elykia-send-btn" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                                </svg>
                            </button>
                        </div>
                        <div class="elykia-input-footer">
                            <span class="elykia-char-count">0/500</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(widget);

            // Get references to elements
            this.chatToggle = widget.querySelector('.elykia-chat-toggle');
            this.chatWindow = widget.querySelector('.elykia-chat-window');
            this.messageInput = widget.querySelector('.elykia-message-input');
            this.sendBtn = widget.querySelector('.elykia-send-btn');
            this.messagesContainer = widget.querySelector('.elykia-messages-container');
            this.typingIndicator = widget.querySelector('.elykia-typing-indicator');
            this.charCount = widget.querySelector('.elykia-char-count');
        }

        bindEvents() {
            // Toggle chat window
            this.chatToggle.addEventListener('click', () => this.toggleChat());

            // Send message on button click
            this.sendBtn.addEventListener('click', () => this.sendMessage());

            // Send message on Enter key
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Update character count
            this.messageInput.addEventListener('input', () => {
                const length = this.messageInput.value.length;
                this.charCount.textContent = `${length}/500`;
                
                // Enable/disable send button
                this.sendBtn.disabled = length === 0;
            });

            // Quick action buttons
            this.messagesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('elykia-quick-btn')) {
                    const action = e.target.textContent;
                    this.handleQuickAction(action);
                }
            });

            // Minimize button
            this.chatWindow.querySelector('.elykia-minimize-btn').addEventListener('click', () => {
                this.toggleChat();
            });
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            this.chatToggle.classList.toggle('active', this.isOpen);
            this.chatWindow.classList.toggle('active', this.isOpen);

            if (this.isOpen) {
                this.messageInput.focus();
            }
        }

        async sendMessage() {
            const text = this.messageInput.value.trim();
            if (!text) return;

            // Add user message
            this.addMessage(text, 'user');
            this.messageInput.value = '';
            this.charCount.textContent = '0/500';
            this.sendBtn.disabled = true;

            // Show typing indicator
            this.showTypingIndicator();

            try {
                // Send to your API
                const response = await this.sendToAPI(text);
                this.hideTypingIndicator();
                this.addMessage(response, 'bot');
            } catch (error) {
                console.error('Error sending message:', error);
                this.hideTypingIndicator();
                this.addMessage("Sorry, I'm having trouble responding right now. Please try again.", 'bot');
            }
        }

        async sendToAPI(message) {
            if (!this.config.botId) {
                return this.generateFallbackResponse(message);
            }

            try {
                const response = await fetch(`${this.config.apiUrl}/api/ai/getModelResponse`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        botId: this.config.botId,
                        chatId: this.generateChatId(),
                        query: message,
                        channel: 'widget',
                        source: window.location.hostname
                    })
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.text();
                return data || "I understand your message, but I'm not sure how to respond right now.";
            } catch (error) {
                console.error('API call failed:', error);
                return this.generateFallbackResponse(message);
            }
        }

        generateChatId() {
            return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }

        generateFallbackResponse(userMessage) {
            const responses = [
                "I understand. Let me help you with that.",
                "That's a great question! Here's what I can tell you...",
                "I'd be happy to assist with that.",
                "Thanks for reaching out. Here's what I found...",
                "I see what you're asking. Here's my response...",
                "Sure thing! Let me provide you with some information..."
            ];

            // Simple keyword-based responses
            const lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
                return "Hello! 😊 What can I do for you today?";
            }

            if (lowerMessage.includes('help')) {
                return "I'm here to help! You can ask me about products, services, or just have a conversation.";
            }

            if (lowerMessage.includes('thank')) {
                return "You're very welcome! Let me know if there's anything else I can help with.";
            }

            if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
                return "Goodbye! 👋 Feel free to chat again anytime.";
            }

            // Return a random response
            return responses[Math.floor(Math.random() * responses.length)];
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `elykia-message ${sender}`;

            if (sender === 'bot') {
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'elykia-bot-avatar';
                avatarDiv.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/>
                    </svg>
                `;
                messageDiv.appendChild(avatarDiv);
            }

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'elykia-message-bubble';
            bubbleDiv.textContent = text;
            messageDiv.appendChild(bubbleDiv);

            // Remove welcome message if this is the first real message
            if (this.messages.length === 0) {
                const welcomeMessage = this.messagesContainer.querySelector('.elykia-welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }
            }

            this.messagesContainer.appendChild(messageDiv);
            this.messages.push({ text, sender, timestamp: new Date() });
            this.scrollToBottom();
        }

        showTypingIndicator() {
            this.typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }

        hideTypingIndicator() {
            this.typingIndicator.style.display = 'none';
        }

        handleQuickAction(action) {
            const responses = {
                'Help Center': "I can guide you to helpful resources. What specifically do you need help with?",
                'Account Info': "I can assist with account-related questions. What would you like to know?"
            };

            const response = responses[action] || `You selected ${action}. How can I help with that?`;
            this.addMessage(response, 'bot');
        }

        scrollToBottom() {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 10);
        }

        // Public API methods
        open() {
            if (!this.isOpen) {
                this.toggleChat();
            }
        }

        close() {
            if (this.isOpen) {
                this.toggleChat();
            }
        }

        destroy() {
            const widget = document.getElementById('elykia-chat-widget');
            if (widget) {
                widget.remove();
            }
        }
    }

    // Global API
    window.elykiaChat = {
        load: function(userConfig = {}) {
            // Initialize the chat widget
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.destroy();
            }
            window.elykiaChatInstance = new ModernChatWidget(userConfig);
            return window.elykiaChatInstance;
        },
        
        open: function() {
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.open();
            }
        },
        
        close: function() {
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.close();
            }
        },
        
        destroy: function() {
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.destroy();
                window.elykiaChatInstance = null;
            }
        }
    };

    // Auto-initialize if config is already available
    if (window.elykiaChatConfig) {
        window.elykiaChat.load(window.elykiaChatConfig);
    }
})();