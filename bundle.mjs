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
            
            this.loadExternalCSS();
            this.createWidget();
            this.bindEvents();
        }

        loadExternalCSS() {
            // Check if CSS is already loaded
            if (document.getElementById('elykia-chat-styles')) {
                return;
            }

            // Load Google Fonts
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
            fontLink.rel = 'stylesheet';
            if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
                document.head.appendChild(fontLink);
            }

            // Load widget CSS
            const cssLink = document.createElement('link');
            cssLink.id = 'elykia-chat-styles';
            cssLink.rel = 'stylesheet';
            cssLink.type = 'text/css';
            // cssLink.href = this.config.apiUrl + '/public/integrations/web/widget.css';
            cssLink.href = 'https://cdn.jsdelivr.net/gh/juli2kapo/TestBundle/widget.css';
            // Add error handling for CSS loading
            cssLink.onerror = () => {
                console.warn('Failed to load Elykia Chat CSS from external file, falling back to inline styles');
                this.injectFallbackStyles();
            };
            
            document.head.appendChild(cssLink);
        }

        injectFallbackStyles() {
            // Fallback inline styles if external CSS fails to load
            const style = document.createElement('style');
            style.id = 'elykia-chat-fallback-styles';
            style.textContent = `
                #elykia-chat-widget {
                    position: fixed !important;
                    bottom: 1.5rem !important;
                    z-index: 2147483647 !important;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                #elykia-chat-widget.position-bottom-left { left: 1.5rem !important; }
                #elykia-chat-widget.position-bottom-right { right: 1.5rem !important; }
                #elykia-chat-widget .elykia-chat-toggle {
                    width: 48px !important; height: 48px !important; border-radius: 50% !important;
                    background: #0ea5e9 !important; border: none !important; cursor: pointer !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                }
                #elykia-chat-widget .elykia-chat-window {
                    position: absolute !important; bottom: 60px !important; width: 340px !important; height: 460px !important;
                    background: white !important; border-radius: 18px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
                    display: flex !important; flex-direction: column !important; opacity: 0 !important; visibility: hidden !important;
                }
                #elykia-chat-widget .elykia-chat-window.active { opacity: 1 !important; visibility: visible !important; }
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
            widget.className = `position-${this.config.position}`;
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

        // ... rest of the methods remain the same as before ...
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