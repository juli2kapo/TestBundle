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
            const style = document.createElement('style');
            style.textContent = `
                /* Chat Widget Styles */
                #elykia-chat-widget * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                #elykia-chat-widget {
                    position: fixed;
                    ${this.config.position === 'bottom-left' ? 'left: 1.5rem;' : 'right: 1.5rem;'}
                    bottom: 1.5rem;
                    z-index: 2147483647;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .elykia-chat-toggle {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .elykia-chat-toggle:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.45);
                }

                .elykia-chat-toggle svg {
                    width: 20px;
                    height: 20px;
                    color: white;
                    transition: all 0.3s ease;
                }

                .elykia-chat-toggle .elykia-close-icon {
                    position: absolute;
                    opacity: 0;
                    transform: rotate(90deg);
                }

                .elykia-chat-toggle.active .elykia-chat-icon {
                    opacity: 0;
                    transform: rotate(-90deg);
                }

                .elykia-chat-toggle.active .elykia-close-icon {
                    opacity: 1;
                    transform: rotate(0deg);
                }

                .elykia-chat-window {
                    position: absolute;
                    bottom: 60px;
                    ${this.config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
                    width: 340px;
                    height: 460px;
                    background: white;
                    border-radius: 18px;
                    box-shadow: 
                        0 10px 30px rgba(0, 0, 0, 0.08),
                        0 0 0 1px rgba(0, 0, 0, 0.02);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(15px) scale(0.95);
                    visibility: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .elykia-chat-window.active {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    visibility: visible;
                }

                .elykia-chat-header {
                    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
                    padding: 1rem 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: white;
                    position: relative;
                    z-index: 10;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                }

                .elykia-header-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .elykia-avatar {
                    width: 34px;
                    height: 34px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .elykia-avatar svg {
                    width: 16px;
                    height: 16px;
                }

                .elykia-header-info h3 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin-bottom: 0.15rem;
                    letter-spacing: -0.2px;
                }

                .elykia-status {
                    font-size: 0.75rem;
                    opacity: 0.9;
                    font-weight: 400;
                }

                .elykia-minimize-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.4rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .elykia-minimize-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .elykia-minimize-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .elykia-messages-container {
                    flex: 1;
                    padding: 1.25rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                    background: #fafcff;
                }

                .elykia-messages-container::-webkit-scrollbar {
                    width: 5px;
                }

                .elykia-messages-container::-webkit-scrollbar-thumb {
                    background: #dbeafe;
                    border-radius: 3px;
                }

                .elykia-messages-container::-webkit-scrollbar-track {
                    background: rgba(219, 234, 254, 0.3);
                }

                .elykia-welcome-message {
                    display: flex;
                    gap: 0.8rem;
                    align-items: flex-start;
                }

                .elykia-bot-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
                }

                .elykia-bot-avatar svg {
                    width: 16px;
                    height: 16px;
                    color: white;
                }

                .elykia-message-content {
                    flex: 1;
                }

                .elykia-message-content p {
                    background: white;
                    padding: 0.8rem 1.1rem;
                    border-radius: 14px 14px 14px 4px;
                    margin-bottom: 0.8rem;
                    color: #1e293b;
                    line-height: 1.45;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
                }

                .elykia-quick-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                }

                .elykia-quick-btn {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0.4rem 0.8rem;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #334155;
                    font-weight: 500;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
                }

                .elykia-quick-btn:hover {
                    border-color: #bae6fd;
                    background: #f0f9ff;
                    color: #0c4a6e;
                    transform: translateY(-1px);
                }

                .elykia-message {
                    display: flex;
                    gap: 0.8rem;
                    margin-bottom: 0.8rem;
                    animation: elykiaFadeIn 0.3s ease-out;
                }

                .elykia-message.user {
                    flex-direction: row-reverse;
                }

                .elykia-message.user .elykia-message-bubble {
                    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
                    color: white;
                    border-radius: 14px 14px 4px 14px;
                    box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
                }

                .elykia-message.bot .elykia-message-bubble {
                    background: white;
                    color: #1e293b;
                    border-radius: 14px 14px 14px 4px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
                }

                .elykia-message-bubble {
                    max-width: 80%;
                    padding: 0.8rem 1.1rem;
                    line-height: 1.45;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }

                .elykia-typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    padding: 0 1.25rem 0.8rem;
                    color: #64748b;
                    font-size: 0.8rem;
                }

                .elykia-typing-dots {
                    display: flex;
                    gap: 4px;
                }

                .elykia-typing-dots span {
                    width: 5px;
                    height: 5px;
                    background: #94a3b8;
                    border-radius: 50%;
                    animation: elykiaTyping 1.4s infinite;
                }

                .elykia-typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .elykia-typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes elykiaTyping {
                    0%, 60%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    30% {
                        transform: scale(1.2);
                        opacity: 1;
                    }
                }
                
                @keyframes elykiaFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .elykia-input-container {
                    padding: 1rem;
                    border-top: 1px solid #f1f5f9;
                    background: white;
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);
                }

                .elykia-input-wrapper {
                    display: flex;
                    gap: 0.6rem;
                    align-items: flex-end;
                }

                .elykia-message-input {
                    flex: 1;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 0.7rem 1.1rem;
                    font-size: 0.9rem;
                    resize: none;
                    outline: none;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    background: #f8fafc;
                }

                .elykia-message-input:focus {
                    border-color: #bae6fd;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(186, 230, 253, 0.3);
                }

                .elykia-send-btn {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .elykia-send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 3px 8px rgba(14, 165, 233, 0.3);
                }

                .elykia-send-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .elykia-send-btn svg {
                    width: 18px;
                    height: 18px;
                    color: white;
                }

                .elykia-input-footer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 0.4rem;
                }

                .elykia-char-count {
                    font-size: 0.7rem;
                    color: #94a3b8;
                }

                /* Responsive Design */
                @media (max-width: 480px) {
                    #elykia-chat-widget {
                        bottom: 1rem;
                        ${this.config.position === 'bottom-left' ? 'left: 1rem;' : 'right: 1rem;'}
                    }

                    .elykia-chat-window {
                        width: calc(100vw - 2rem);
                        height: calc(100vh - 120px);
                        bottom: 60px;
                        ${this.config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
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