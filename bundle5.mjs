(function() {
    'use strict';
    
    // Configuration object that will be set by the parent page
    let config = {
        botId: null,
        apiUrl: 'https://bots.elykia.com.ar',
        theme: 'light', // Theme currently primarily affects icon/text color on primary backgrounds
        position: 'bottom-right',
        botName: 'Nova Assistant',
        welcomeMessage: "Hi there! 👋 I'm Nova, your AI assistant. How can I help you today?",
        primaryColor: '#0ea5e9', // Example: A medium blue
        secondaryColor: '#0d9488' // Retained in config, though not used in default widget gradients anymore
    };

    class ModernChatWidget {
        constructor(userConfig = {}) {
            this.config = { ...config, ...userConfig };
            this.isOpen = false;
            this.messages = [];
            this.isInitialized = false;
            
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
            if (document.getElementById('elykia-chat-styles')) {
                return;
            }

            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
            fontLink.rel = 'stylesheet';
            if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
                document.head.appendChild(fontLink);
            }

            const style = document.createElement('style');
            style.id = 'elykia-chat-styles';
            style.textContent = `
                #elykia-chat-widget {
                    all: initial !important;
                    position: fixed !important;
                    ${this.config.position === 'bottom-left' ? 'left: 1rem !important;' : 'right: 1rem !important;'}
                    bottom: 1rem !important;
                    z-index: 2147483647 !important;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.4 !important; /* Adjusted for functional feel */
                    color: #333 !important; /* Default text color */
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

                /* Chat toggle button - More functional */
                #elykia-chat-widget .elykia-chat-toggle {
                    width: 48px !important;
                    height: 48px !important;
                    border-radius: 8px !important; /* Squarer */
                    background: ${this.config.primaryColor} !important; /* Solid color */
                    border: none !important;
                    cursor: pointer !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* Softer shadow */
                    transition: all 0.2s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    position: relative !important;
                }

                #elykia-chat-widget .elykia-chat-toggle:hover {
                    background: ${this.adjustColor(this.config.primaryColor, -0.15)} !important; /* Darken on hover */
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                    transform: translateY(-1px) !important;
                }

                #elykia-chat-widget .elykia-chat-toggle svg {
                    width: 22px !important; /* Slightly larger for clarity */
                    height: 22px !important;
                    color: white !important; /* Assuming primaryColor is dark enough */
                    transition: all 0.3s ease !important;
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 1.8 !important; /* Slightly thinner stroke */
                }

                #elykia-chat-widget .elykia-chat-toggle .elykia-close-icon {
                    position: absolute !important;
                    opacity: 0 !important;
                    transform: rotate(90deg) scale(0.8) !important;
                }

                #elykia-chat-widget .elykia-chat-toggle.active .elykia-chat-icon {
                    opacity: 0 !important;
                    transform: rotate(-90deg) scale(0.8) !important;
                }

                #elykia-chat-widget .elykia-chat-toggle.active .elykia-close-icon {
                    opacity: 1 !important;
                    transform: rotate(0deg) scale(1) !important;
                }

                /* Chat window - More functional */
                #elykia-chat-widget .elykia-chat-window {
                    position: absolute !important;
                    bottom: calc(100% + 12px) !important; /* Position above toggle */
                    ${this.config.position === 'bottom-left' ? 'left: 0 !important;' : 'right: 0 !important;'}
                    width: 350px !important; /* Slightly wider */
                    height: 480px !important; /* Slightly taller */
                    background: #ffffff !important;
                    border-radius: 8px !important; /* Consistent radius */
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05) !important; /* Defined shadow */
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    opacity: 0 !important;
                    transform: translateY(10px) scale(0.98) !important;
                    visibility: hidden !important;
                    transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease !important;
                }

                #elykia-chat-widget .elykia-chat-window.active {
                    opacity: 1 !important;
                    transform: translateY(0) scale(1) !important;
                    visibility: visible !important;
                }

                /* Chat header - Cleaner */
                #elykia-chat-widget .elykia-chat-header {
                    background: ${this.config.primaryColor} !important; /* Solid primary color */
                    padding: 0.8rem 1rem !important; /* Adjusted padding */
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important; /* Allow for a close button if added later */
                    color: white !important; /* Text color on primary background */
                    position: relative !important;
                    z-index: 10 !important;
                    border-bottom: 1px solid ${this.adjustColor(this.config.primaryColor, -0.1)} !important; /* Subtle border */
                }
                
                #elykia-chat-widget .elykia-header-content {
                    display: flex !important;
                    align-items: center !important;
                    gap: 0.65rem !important;
                }

                #elykia-chat-widget .elykia-avatar { /* Used in header */
                    width: 32px !important;
                    height: 32px !important;
                    background: rgba(255, 255, 255, 0.15) !important; /* Subtle avatar background */
                    border-radius: 50% !important; /* Keep avatar circular */
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
                    font-size: 0.9rem !important;
                    font-weight: 500 !important; /* Medium weight */
                    margin-bottom: 0.1rem !important;
                    color: white !important;
                }

                #elykia-chat-widget .elykia-status {
                    font-size: 0.7rem !important;
                    opacity: 0.85 !important;
                    font-weight: 400 !important;
                    color: white !important;
                }

                /* Messages container */
                #elykia-chat-widget .elykia-messages-container {
                    flex: 1 !important;
                    padding: 1rem !important; /* Consistent padding */
                    overflow-y: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 0.75rem !important; /* Space between messages */
                    background: #f9f9f9 !important; /* Lightly textured background for message area */
                }

                #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar {
                    width: 6px !important;
                }

                #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar-thumb {
                    background: #cccccc !important; /* Neutral scrollbar */
                    border-radius: 3px !important;
                }

                #elykia-chat-widget .elykia-messages-container::-webkit-scrollbar-track {
                    background: #efefef !important;
                }
                
                /* Message bubbles - More functional and distinct */
                #elykia-chat-widget .elykia-message {
                    display: flex !important;
                    gap: 0.6rem !important; /* Space between avatar and bubble */
                    margin-bottom: 0.25rem !important; /* Reduced margin between subsequent messages of same type */
                    animation: elykiaFadeIn 0.25s ease-out !important;
                    align-items: flex-end !important; /* Align avatar and bubble bottom */
                    max-width: 90% !important; /* Prevent message taking full width */
                }
                
                #elykia-chat-widget .elykia-message.user {
                    flex-direction: row-reverse !important;
                    margin-left: auto !important; /* Align user message group to right */
                }
                #elykia-chat-widget .elykia-message.bot {
                    margin-right: auto !important; /* Align bot message group to left */
                }

                #elykia-chat-widget .elykia-bot-avatar { /* Avatar in message list */
                    width: 28px !important; /* Smaller avatar in messages */
                    height: 28px !important;
                    background: ${this.config.primaryColor} !important; /* Solid color */
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    flex-shrink: 0 !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                }

                #elykia-chat-widget .elykia-bot-avatar svg {
                    width: 14px !important;
                    height: 14px !important;
                    color: white !important;
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 1.5 !important;
                }
                
                #elykia-chat-widget .elykia-message-bubble {
                    padding: 0.6rem 0.9rem !important; /* Adjusted padding */
                    line-height: 1.45 !important;
                    font-size: 0.875rem !important; /* Slightly smaller text in bubbles */
                    border-radius: 6px !important; /* Squarer bubbles */
                    box-shadow: 0 1px 1px rgba(0,0,0,0.05) !important;
                }

                #elykia-chat-widget .elykia-message.user .elykia-message-bubble {
                    background: ${this.config.primaryColor} !important; /* User messages primary color */
                    color: white !important; /* Text on primary color */
                }

                #elykia-chat-widget .elykia-message.bot .elykia-message-bubble {
                    background: #e9e9eb !important; /* Neutral background for bot messages */
                    color: #2c2d2e !important; /* Darker text for bot messages */
                }
                
                /* Initial Welcome Message specific styling (if needed, using elykia-initial-welcome-message class) */
                #elykia-chat-widget .elykia-initial-welcome-message .elykia-message-bubble {
                     background: #e0eaff !important; /* Slightly different welcome bubble */
                     color: #334155 !important;
                }


                /* Input container */
                #elykia-chat-widget .elykia-input-container {
                    padding: 0.75rem 1rem !important; /* Adjusted padding */
                    border-top: 1px solid #e0e0e0 !important; /* Clear separator */
                    background: #fdfdfd !important;
                }

                #elykia-chat-widget .elykia-input-wrapper {
                    display: flex !important;
                    gap: 0.5rem !important;
                    align-items: flex-end !important; /* Align input and button nicely */
                }

                #elykia-chat-widget .elykia-message-input {
                    flex: 1 !important;
                    border: 1px solid #d1d5db !important; /* Standard border */
                    border-radius: 6px !important; /* Squarer input */
                    padding: 0.6rem 0.9rem !important;
                    font-size: 0.875rem !important;
                    resize: none !important;
                    outline: none !important;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    line-height: 1.4 !important;
                }

                #elykia-chat-widget .elykia-message-input:focus {
                    border-color: ${this.config.primaryColor} !important;
                    box-shadow: 0 0 0 2px ${this.config.primaryColor}40 !important; /* Focus ring with primary color */
                }

                #elykia-chat-widget .elykia-message-input::placeholder {
                    color: #9ca3af !important; /* Softer placeholder */
                    font-weight: 400 !important;
                }

                #elykia-chat-widget .elykia-send-btn {
                    width: 38px !important; /* Slightly smaller send button */
                    height: 38px !important;
                    background: ${this.config.primaryColor} !important;
                    border: none !important;
                    border-radius: 6px !important; /* Squarer */
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: background-color 0.2s ease !important;
                }

                #elykia-chat-widget .elykia-send-btn:hover:not(:disabled) {
                    background: ${this.adjustColor(this.config.primaryColor, -0.15)} !important; /* Darken on hover */
                }

                #elykia-chat-widget .elykia-send-btn:disabled {
                    background-color: #d1d5db !important; /* Disabled state uses neutral color */
                    opacity: 0.7 !important;
                    cursor: not-allowed !important;
                }
                #elykia-chat-widget .elykia-send-btn:disabled svg {
                    color: #6b7280 !important;
                }


                #elykia-chat-widget .elykia-send-btn svg {
                    width: 18px !important;
                    height: 18px !important;
                    color: white !important; /* Icon color on primary background */
                    fill: none !important;
                    stroke: currentColor !important;
                    stroke-width: 2 !important; /* Standard stroke */
                }

                #elykia-chat-widget .elykia-input-footer {
                    display: flex !important;
                    justify-content: flex-end !important;
                    margin-top: 0.3rem !important;
                    height: 0.7rem; /* Reserve space to prevent layout shift */
                }

                #elykia-chat-widget .elykia-char-count {
                    font-size: 0.65rem !important; /* Smaller char count */
                    color: #6b7280 !important; /* Muted color */
                }

                /* Animations */
                @keyframes elykiaFadeIn {
                    from {
                        opacity: 0 !important;
                        transform: translateY(3px) !important;
                    }
                    to {
                        opacity: 1 !important;
                        transform: translateY(0) !important;
                    }
                }

                /* Responsive Design */
                @media (max-width: 480px) {
                    #elykia-chat-widget {
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        display: flex !important;
                        flex-direction: column-reverse !important; /* Makes toggle appear below window when full screen */
                    }

                    #elykia-chat-widget .elykia-chat-toggle {
                         border-radius: 0 !important;
                         width: 100% !important;
                         height: 50px !important;
                         position: relative !important; /* Ensure it's part of the flow or fixed */
                         box-shadow: 0 -2px 5px rgba(0,0,0,0.1) !important;
                    }
                    #elykia-chat-widget .elykia-chat-toggle.active {
                         /* Optionally change style when window is open on mobile */
                    }


                    #elykia-chat-widget .elykia-chat-window {
                        width: 100% !important;
                        height: calc(100vh - 50px) !important; /* Full height minus toggle */
                        bottom: 50px !important; /* Sits above toggle */
                        left: 0 !important;
                        right: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        border-top: 1px solid #ddd !important;
                        position: fixed !important; /* Fixed to fill screen */
                    }
                     #elykia-chat-widget .elykia-chat-window.active {
                        transform: translateY(0) scale(1) !important; /* Ensure it's visible correctly */
                    }


                    #elykia-chat-widget .elykia-messages-container {
                        padding: 0.75rem !important;
                    }
                    #elykia-chat-widget .elykia-input-container {
                        padding: 0.5rem 0.75rem !important;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }

        // Helper to adjust color brightness (simple version for hex colors)
        adjustColor(hex, percent) {
            let R = parseInt(hex.substring(1,3),16);
            let G = parseInt(hex.substring(3,5),16);
            let B = parseInt(hex.substring(5,7),16);
        
            R = parseInt(R * (1 + percent));
            G = parseInt(G * (1 + percent));
            B = parseInt(B * (1 + percent));
        
            R = (R<255)?R:255;  
            G = (G<255)?G:255;  
            B = (B<255)?B:255;  
        
            R = (R>0)?R:0;
            G = (G>0)?G:0;
            B = (B>0)?B:0;

            const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
            const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
            const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
        
            return "#"+RR+GG+BB;
        }


        createWidget() {
            const existingWidget = document.getElementById('elykia-chat-widget');
            if (existingWidget) {
                existingWidget.remove();
            }

            const widget = document.createElement('div');
            widget.id = 'elykia-chat-widget';
            widget.innerHTML = `
                <button class="elykia-chat-toggle">
                    <svg class="elykia-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg> <svg class="elykia-close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> </button>

                <div class="elykia-chat-window">
                    <div class="elykia-chat-header">
                        <div class="elykia-header-content">
                            <div class="elykia-avatar">
                                <svg viewBox="0 0 24 24"><path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> </div>
                            <div class="elykia-header-info">
                                <h3>${this.config.botName}</h3>
                                <span class="elykia-status">Typically replies instantly</span>
                            </div>
                        </div>
                    </div>

                    <div class="elykia-messages-container">
                        <div class="elykia-message bot elykia-initial-welcome-message">
                            <div class="elykia-bot-avatar">
                                 <svg viewBox="0 0 24 24"><path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                            <div class="elykia-message-bubble">
                                ${this.config.welcomeMessage}
                            </div>
                        </div>
                    </div>

                    <div class="elykia-input-container">
                        <div class="elykia-input-wrapper">
                            <textarea class="elykia-message-input" placeholder="Type your message..." maxlength="500" rows="1"></textarea>
                            <button class="elykia-send-btn" disabled>
                                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> </button>
                        </div>
                        <div class="elykia-input-footer">
                            <span class="elykia-char-count">0/500</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(widget);

            this.chatToggle = widget.querySelector('.elykia-chat-toggle');
            this.chatWindow = widget.querySelector('.elykia-chat-window');
            this.messageInput = widget.querySelector('.elykia-message-input');
            this.sendBtn = widget.querySelector('.elykia-send-btn');
            this.messagesContainer = widget.querySelector('.elykia-messages-container');
            this.charCount = widget.querySelector('.elykia-char-count');
            
            // Auto-adjust textarea height
            this.messageInput.addEventListener('input', () => this.autoAdjustTextareaHeight());
            this.autoAdjustTextareaHeight(); // Initial adjust
        }

        autoAdjustTextareaHeight() {
            this.messageInput.style.height = 'auto'; // Reset height
            let newHeight = this.messageInput.scrollHeight;
            const maxHeight = 80; // Max height for 3-4 lines approx.
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                this.messageInput.style.overflowY = 'auto';
            } else {
                this.messageInput.style.overflowY = 'hidden';
            }
            this.messageInput.style.height = newHeight + 'px';
        }


        bindEvents() {
            this.chatToggle.addEventListener('click', () => this.toggleChat());
            this.sendBtn.addEventListener('click', () => this.sendMessage());

            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.messageInput.addEventListener('input', () => {
                const value = this.messageInput.value;
                const length = value.length;
                this.charCount.textContent = `${length}/500`;
                this.sendBtn.disabled = length === 0 || value.trim() === '';
            });
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            this.chatToggle.classList.toggle('active', this.isOpen);
            this.chatWindow.classList.toggle('active', this.isOpen);

            if (this.isOpen) {
                this.messageInput.focus();
                this.scrollToBottom(); // Scroll to bottom when opening
            }
        }

        async sendMessage() {
            const text = this.messageInput.value.trim();
            if (!text) return;

            this.addMessage(text, 'user');
            this.messageInput.value = '';
            this.charCount.textContent = '0/500';
            this.sendBtn.disabled = true;
            this.autoAdjustTextareaHeight(); // Reset textarea height
            this.messageInput.focus();


            try {
                const response = await this.sendToAPI(text);
                this.addMessage(response, 'bot');
            } catch (error) {
                console.error('Error sending message:', error);
                this.addMessage("I'm having technical difficulties. Please try again in a moment.", 'bot');
            }
        }

        async sendToAPI(message) {
            if (!this.config.botId) {
                // Simulate API delay for fallback
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
                return this.generateFallbackResponse(message);
            }

            try {
                const response = await fetch(`${this.config.apiUrl}/api/ai/getModelResponse`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        botId: this.config.botId,
                        chatId: this.generateChatId(),
                        query: message,
                        channel: 'widget',
                        source: window.location.hostname
                    })
                });

                if (!response.ok) throw new Error(`API error: ${response.status}`);
                const data = await response.text();
                return data || "I received your message, but I'm not sure how to respond.";
            } catch (error) {
                console.error('API call failed:', error);
                return this.generateFallbackResponse(message, true); // Indicate error for fallback
            }
        }

        generateChatId() {
            return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }

        generateFallbackResponse(userMessage, isError = false) {
            if (isError) return "My apologies, I couldn't process that. Could you try rephrasing?";
            
            const lowerMessage = userMessage.toLowerCase();
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) return "Hi there! How can I assist?";
            if (lowerMessage.includes('help')) return "Sure, I'm here to help. What's your question?";
            if (lowerMessage.includes('thank')) return "You're welcome! Is there anything else?";
            if (lowerMessage.includes('bye')) return "Goodbye! Have a great day.";
            
            const genericResponses = [
                "Understood. Let me see what I can do.",
                "That's an interesting point.",
                "Let me think about that for a moment.",
                "Thanks for sharing. How can I elaborate?"
            ];
            return genericResponses[Math.floor(Math.random() * genericResponses.length)];
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `elykia-message ${sender}`;

            // Only add avatar for bot messages
            if (sender === 'bot') {
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'elykia-bot-avatar';
                avatarDiv.innerHTML = `
                    <svg viewBox="0 0 24 24"><path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                `;
                messageDiv.appendChild(avatarDiv);
            }

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'elykia-message-bubble';
            // Sanitize text before setting as textContent if it might contain HTML-like structures from bot
            // For simplicity, assuming plain text from bot for now. If HTML is expected, use a sanitizer.
            bubbleDiv.textContent = text; 
            messageDiv.appendChild(bubbleDiv);

            // Remove welcome message if this is the first real message after welcome
            if (this.messages.length === 0 || (this.messages.length === 1 && this.messages[0].sender === 'welcome_init')) {
                const welcomeMsgElement = this.messagesContainer.querySelector('.elykia-initial-welcome-message');
                if (welcomeMsgElement) {
                    welcomeMsgElement.remove();
                }
                // If this is the first message, ensure this.messages doesn't still think welcome is the only one
                if(this.messages.length === 1 && this.messages[0].sender === 'welcome_init') {
                    this.messages = []; // Clear the dummy welcome_init message
                }
            }
            
            this.messagesContainer.appendChild(messageDiv);
            // Store actual messages
            if (sender !== 'welcome_init') { // Don't store the initial marker
                 this.messages.push({ text, sender, timestamp: new Date() });
            }
            this.scrollToBottom();
        }

        scrollToBottom() {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 50); // Slight delay for content to render
        }

        open() { if (!this.isOpen) this.toggleChat(); }
        close() { if (this.isOpen) this.toggleChat(); }
        destroy() {
            const widget = document.getElementById('elykia-chat-widget');
            if (widget) widget.remove();
            const styles = document.getElementById('elykia-chat-styles');
            if (styles) styles.remove();
            // Remove DOMContentLoaded listener if any was added by this instance
            // (though in this setup, it's a one-shot init)
        }
    }

    // Global API
    window.elykiaChat = {
        load: function(userConfig = {}) {
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.destroy();
            }
            // Add a dummy message to track if welcome message is the only one
            // This assumes config is loaded before first message.
            const internalConfig = {...userConfig};
            if (!internalConfig.messages || internalConfig.messages.length === 0) {
                 // This is a bit of a hack; state should ideally be fully in the instance
                 // For now, we use this to manage welcome message removal.
            }

            window.elykiaChatInstance = new ModernChatWidget(internalConfig);
            // If there's a welcome message, log it conceptually
            if (window.elykiaChatInstance && window.elykiaChatInstance.config.welcomeMessage) {
                 window.elykiaChatInstance.messages.push({text: "Welcome", sender: "welcome_init", timestamp: new Date()});
            }
            return window.elykiaChatInstance;
        },
        open: function() { if (window.elykiaChatInstance) window.elykiaChatInstance.open(); },
        close: function() { if (window.elykiaChatInstance) window.elykiaChatInstance.close(); },
        destroy: function() {
            if (window.elykiaChatInstance) {
                window.elykiaChatInstance.destroy();
                window.elykiaChatInstance = null;
            }
        }
    };

    if (window.elykiaChatConfig) {
        window.elykiaChat.load(window.elykiaChatConfig);
    }
})();
