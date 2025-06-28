// ChatApp JavaScript - Complete functionality with Server API

class ChatApp {
    constructor() {
        this.currentUser = null;
        this.friends = [];
        this.currentChat = null;
        this.api = new ApiService();
        this.notificationInterval = null;
        this.userTimezone = this.detectTimezone();
        this.userLocation = null; // Store user's location
        this.eventListenersSetup = false; // Flag to prevent duplicate event binding
        this.isSendingMessage = false; // Flag to prevent duplicate message sending
        this.lastMessageTime = 0; // Track last message time for debouncing
        this.init();
    }

    detectTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
            console.error('Error detecting timezone:', error);
            return 'UTC';
        }
    }

    async getLocationBasedTimezone() {
        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                this.showNotification('Geolocation is not supported by your browser', 'error');
                return;
            }

            // Show loading state
            const locationBtn = document.getElementById('location-btn');
            if (locationBtn) {
                locationBtn.classList.add('loading');
                locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                locationBtn.title = 'Getting location...';
            }

            // Show loading notification
            this.showNotification('Getting your location for accurate timezone...', 'info');
            
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            // Store location for future use
            this.userLocation = { latitude, longitude };
            
            // Use a timezone API to get accurate timezone based on coordinates
            const timezone = await this.getTimezoneFromCoordinates(latitude, longitude);
            
            if (timezone) {
                this.userTimezone = timezone;
                this.showNotification(`Timezone updated to: ${timezone}`, 'success');
                this.updateTimezoneDisplay();
                
                // Update the location button to show success
                if (locationBtn) {
                    locationBtn.classList.remove('loading');
                    locationBtn.classList.add('success');
                    locationBtn.innerHTML = '<i class="fas fa-check"></i>';
                    locationBtn.title = `Location set: ${timezone}`;
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        locationBtn.classList.remove('success');
                        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                        locationBtn.title = 'Get Location Timezone';
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error getting location-based timezone:', error);
            
            // Reset button state
            const locationBtn = document.getElementById('location-btn');
            if (locationBtn) {
                locationBtn.classList.remove('loading');
                locationBtn.classList.add('error');
                locationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    locationBtn.classList.remove('error');
                    locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                    locationBtn.title = 'Get Location Timezone';
                }, 3000);
            }
            
            // Handle specific geolocation errors
            if (error.code === 1) {
                this.showNotification('Location permission denied. Please allow location access for accurate timezone.', 'error');
            } else if (error.code === 2) {
                this.showNotification('Location unavailable. Please check your device settings.', 'error');
            } else if (error.code === 3) {
                this.showNotification('Location request timed out. Please try again.', 'error');
            } else {
                this.showNotification('Failed to get location. Using browser timezone.', 'warning');
            }
            
            // Fallback to browser timezone
            this.updateTimezoneDisplay();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    async getTimezoneFromCoordinates(latitude, longitude) {
        try {
            // Use a free timezone API
            const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${latitude}&lng=${longitude}`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                return data.zoneName;
            }
        } catch (error) {
            console.error('Error fetching timezone from API:', error);
        }

        // Fallback: Use a simple timezone estimation based on longitude
        return this.estimateTimezoneFromLongitude(longitude);
    }

    estimateTimezoneFromLongitude(longitude) {
        // Simple timezone estimation based on longitude
        // This is a rough approximation
        const timezoneOffset = Math.round(longitude / 15);
        const utcOffset = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;
        
        // Map to common timezone names
        const timezoneMap = {
            '-12': 'Pacific/Auckland',
            '-11': 'Pacific/Auckland',
            '-10': 'Pacific/Honolulu',
            '-9': 'America/Anchorage',
            '-8': 'America/Los_Angeles',
            '-7': 'America/Denver',
            '-6': 'America/Chicago',
            '-5': 'America/New_York',
            '-4': 'America/Toronto',
            '-3': 'America/Sao_Paulo',
            '-2': 'Atlantic/South_Georgia',
            '-1': 'Atlantic/Azores',
            '0': 'Europe/London',
            '1': 'Europe/Paris',
            '2': 'Europe/Helsinki',
            '3': 'Europe/Moscow',
            '4': 'Asia/Dubai',
            '5': 'Asia/Karachi',
            '6': 'Asia/Dhaka',
            '7': 'Asia/Bangkok',
            '8': 'Asia/Shanghai',
            '9': 'Asia/Tokyo',
            '10': 'Australia/Sydney',
            '11': 'Pacific/Guadalcanal',
            '12': 'Pacific/Auckland'
        };

        return timezoneMap[timezoneOffset] || 'UTC';
    }

    updateTimezoneDisplay() {
        console.log('updateTimezoneDisplay called');
        const timezoneText = document.getElementById('timezone-text');
        console.log('timezone-text element found:', timezoneText);
        
        if (timezoneText) {
            console.log('Updating timezone text to:', this.userTimezone);
            timezoneText.textContent = this.userTimezone;
        } else {
            console.error('timezone-text element not found');
        }
        
        // Check for any duplicate timezone elements
        const allTimezoneElements = document.querySelectorAll('[id*="timezone"], [class*="timezone"]');
        console.log('All timezone-related elements found:', allTimezoneElements.length);
        allTimezoneElements.forEach((el, index) => {
            console.log(`Timezone element ${index}:`, el.id, el.className, el.textContent);
        });
        
        // Don't update the timezone-info element as it already contains the timezone-text
        // This was causing duplicate timezone displays
    }

    async init() {
        try {
            console.log('Initializing ChatApp...');
            this.setupEventListeners();
            
            console.log('Checking server connection...');
            const serverConnected = await this.checkServerConnection();
            
            if (!serverConnected) {
                throw new Error('Server is not accessible');
            }
            
            console.log('Checking auth status...');
            await this.checkAuthStatus();
            
            console.log('ChatApp initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showNotification(`Failed to initialize app: ${error.message}. Please refresh the page.`, 'error');
        }
    }

    async checkServerConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${this.api.baseUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const isConnected = response.ok;
            this.updateServerStatus(isConnected);
            
            if (!isConnected) {
                console.error('Server responded but with error status:', response.status);
                this.showNotification('Server is responding but with errors. Please check your connection.', 'error');
            }
            
            return isConnected;
        } catch (error) {
            console.error('Server connection check failed:', error);
            this.updateServerStatus(false);
            
            if (error.name === 'AbortError') {
                this.showNotification('Server connection timeout. Please check your connection.', 'error');
            } else {
                this.showNotification('Server is offline. Please check your connection.', 'error');
            }
            
            return false;
        }
    }

    updateServerStatus(isOnline) {
        const indicator = document.getElementById('server-status-indicator');
        const text = document.getElementById('server-status-text');
        
        if (isOnline) {
            indicator.className = 'status-indicator online';
            // Show which server is being used
            const serverUrl = this.api.baseUrl.replace('/api', '');
            text.textContent = `Server Online (${serverUrl})`;
        } else {
            indicator.className = 'status-indicator offline';
            // Show which server failed to connect
            const serverUrl = this.api.baseUrl.replace('/api', '');
            text.textContent = `Server Offline (${serverUrl})`;
        }
    }

    setupEventListeners() {
        try {
            if (this.eventListenersSetup) {
                console.log('Event listeners already setup, skipping...');
                return;
            }
            
            console.log('Setting up event listeners...');
            
            // Auth events
            const showRegister = document.getElementById('show-register');
            const showLogin = document.getElementById('show-login');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');

            if (showRegister) {
                showRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleAuthForms();
                });
            }

            if (showLogin) {
                showLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleAuthForms();
                });
            }

            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            }

            this.eventListenersSetup = true;
            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw error;
        }
    }

    setupChatEventListeners() {
        // Use a more reliable approach to prevent duplicate event binding
        const messageText = document.getElementById('message-text');
        const sendBtn = document.getElementById('send-btn');
        
        // Clear any existing event listeners by cloning and replacing elements
        if (messageText) {
            const newMessageText = messageText.cloneNode(true);
            messageText.parentNode.replaceChild(newMessageText, messageText);
        }
        
        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        }
        
        // Get the new elements
        const newMessageText = document.getElementById('message-text');
        const newSendBtn = document.getElementById('send-btn');
        
        // Chat events - these might not exist initially
        const logoutBtn = document.getElementById('logout-btn');
        const profileBtn = document.getElementById('profile-btn');
        const locationBtn = document.getElementById('location-btn');
        const notificationsBtn = document.getElementById('notifications-btn');
        const friendRequestsBtn = document.getElementById('friend-requests-btn');
        const addFriendBtn = document.getElementById('add-friend-btn');
        const chatMenuBtn = document.getElementById('chat-menu-btn');
        const unfriendBtn = document.getElementById('unfriend-btn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.openProfileModal();
            });
        }

        if (locationBtn) {
            locationBtn.addEventListener('click', () => {
                this.getLocationBasedTimezone();
            });
        }

        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.openNotificationsModal();
            });
        }

        if (friendRequestsBtn) {
            friendRequestsBtn.addEventListener('click', () => {
                this.openFriendRequestsModal();
            });
        }

        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                this.openAddFriendModal();
            });
        }

        // Chat menu functionality
        if (chatMenuBtn) {
            chatMenuBtn.addEventListener('click', () => {
                this.toggleChatMenu();
            });
        }

        if (unfriendBtn) {
            unfriendBtn.addEventListener('click', () => {
                this.unfriendCurrentChat();
            });
        }

        // Close chat menu when clicking outside
        document.addEventListener('click', (e) => {
            const chatMenu = document.getElementById('chat-menu-dropdown');
            const chatMenuBtn = document.getElementById('chat-menu-btn');
            
            if (chatMenu && !chatMenu.contains(e.target) && !chatMenuBtn.contains(e.target)) {
                chatMenu.classList.add('hidden');
            }
        });

        // Modal close events
        const closeProfileModal = document.getElementById('close-profile-modal');
        const closeAddFriendModal = document.getElementById('close-add-friend-modal');
        const closeNotificationsModal = document.getElementById('close-notifications-modal');
        const closeFriendRequestsModal = document.getElementById('close-friend-requests-modal');

        if (closeProfileModal) {
            closeProfileModal.addEventListener('click', () => {
                this.closeProfileModal();
            });
        }

        if (closeAddFriendModal) {
            closeAddFriendModal.addEventListener('click', () => {
                this.closeAddFriendModal();
            });
        }

        if (closeNotificationsModal) {
            closeNotificationsModal.addEventListener('click', () => {
                this.closeNotificationsModal();
            });
        }

        if (closeFriendRequestsModal) {
            closeFriendRequestsModal.addEventListener('click', () => {
                this.closeFriendRequestsModal();
            });
        }

        // Form submissions
        const profileForm = document.getElementById('profile-form');
        const addFriendForm = document.getElementById('add-friend-form');

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        if (addFriendForm) {
            addFriendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addFriend();
            });
        }

        // Search functionality
        const searchFriends = document.getElementById('search-friends');
        if (searchFriends) {
            searchFriends.addEventListener('input', (e) => {
                this.searchFriends(e.target.value);
            });
        }

        // Message input - with new elements
        if (newMessageText) {
            newMessageText.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.sendMessage();
                }
            });
        }

        if (newSendBtn) {
            newSendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendMessage();
            });
        }
        
        // File upload
        const attachBtn = document.getElementById('attach-btn');
        const fileInput = document.getElementById('file-input');
        const cancelUpload = document.getElementById('cancel-upload');
        
        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        // Show file preview and confirmation dialog
                        const confirmed = await this.showFileUploadConfirmation(file);
                        
                        if (!confirmed) {
                            fileInput.value = '';
                            return;
                        }
                        
                        this.showNotification('Uploading file...', 'info');
                        const result = await this.uploadFile(file);
                        
                        // Determine message type
                        let messageType = 'document';
                        if (file.type.startsWith('image/')) {
                            messageType = 'image';
                        } else if (file.type.startsWith('video/')) {
                            messageType = 'video';
                        } else if (file.type.startsWith('audio/')) {
                            messageType = 'audio';
                        }
                        
                        // Send message with file
                        await this.sendFileMessage(result.fileUrl, file.name, result.fileSize, result.fileType, messageType);
                        
                        this.showNotification('File sent successfully', 'success');
                    } catch (error) {
                        console.error('File upload error:', error);
                        this.showNotification('Failed to upload file', 'error');
                    } finally {
                        fileInput.value = '';
                    }
                }
            });
        }
        
        if (cancelUpload) {
            cancelUpload.addEventListener('click', () => {
                this.cancelFileUpload();
            });
        }
        
        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const currentEmojiPicker = document.getElementById('emoji-picker');
            const currentEmojiBtn = document.getElementById('emoji-btn');
            
            if (currentEmojiPicker && currentEmojiBtn && 
                !currentEmojiPicker.contains(e.target) && 
                !currentEmojiBtn.contains(e.target)) {
                currentEmojiPicker.classList.add('hidden');
            }
        });

        // Mark all notifications as read
        const markAllReadBtn = document.getElementById('mark-all-read-btn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsAsRead();
            });
        }

        // Avatar upload
        const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
        const avatarInput = document.getElementById('avatar-input');
        
        if (uploadAvatarBtn) {
            uploadAvatarBtn.addEventListener('click', () => {
                avatarInput.click();
            });
        }
        
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
    }

    toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await this.api.login({ username, password });
            
            if (response.success) {
                this.currentUser = response.user;
                this.showChatInterface();
                this.startNotificationPolling();
                this.showNotification('Login successful!', 'success');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please try again.', 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            this.showNotification('Username must be 3-20 characters, letters, numbers, and underscores only', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await this.api.register({ username, email, name: username, password });
            
            if (response.success) {
                this.currentUser = response.user;
                this.showChatInterface();
                this.startNotificationPolling();
                this.showNotification('Registration successful!', 'success');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
        }
    }

    handleLogout() {
        this.api.clearCurrentUser();
        this.currentUser = null;
        this.currentChat = null;
        this.stopNotificationPolling();
        this.showAuthInterface();
        this.showNotification('Logged out successfully', 'success');
    }

    async checkAuthStatus() {
        const user = this.api.getCurrentUser();
        if (user) {
            this.currentUser = user;
            this.showChatInterface();
            this.startNotificationPolling();
        } else {
            this.showAuthInterface();
        }
    }

    showAuthInterface() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('chat-container').classList.add('hidden');
    }

    showChatInterface() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('chat-container').classList.remove('hidden');
        this.updateUserInfo();
        this.setupChatEventListeners();
        this.loadFriends();
        this.loadNotifications();
        this.updateTimezoneDisplay();
        
        // Initialize emoji picker with retry mechanism
        this.initializeEmojiPicker();
    }

    initializeEmojiPicker() {
        const maxRetries = 5;
        let retryCount = 0;
        
        const trySetupEmoji = () => {
            const emojiBtn = document.getElementById('emoji-btn');
            const emojiPicker = document.getElementById('emoji-picker');
            
            console.log(`Emoji setup attempt ${retryCount + 1}:`, { 
                emojiBtn: !!emojiBtn, 
                emojiPicker: !!emojiPicker 
            });
            
            if (emojiBtn && emojiPicker) {
                console.log('Emoji elements found, setting up event listeners');
                
                // Remove existing event listeners
                const newEmojiBtn = emojiBtn.cloneNode(true);
                emojiBtn.parentNode.replaceChild(newEmojiBtn, emojiBtn);
                
                newEmojiBtn.addEventListener('click', (e) => {
                    console.log('Emoji button clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const currentEmojiPicker = document.getElementById('emoji-picker');
                    console.log('Current emoji picker element:', currentEmojiPicker);
                    
                    if (currentEmojiPicker) {
                        const isHidden = currentEmojiPicker.classList.contains('hidden');
                        console.log('Emoji picker is hidden:', isHidden);
                        
                        if (isHidden) {
                            currentEmojiPicker.classList.remove('hidden');
                            this.loadEmojis();
                            console.log('Emoji picker shown and emojis loaded');
                        } else {
                            currentEmojiPicker.classList.add('hidden');
                            console.log('Emoji picker hidden');
                        }
                    } else {
                        console.error('Emoji picker element not found');
                    }
                });
                
                // Close emoji picker when clicking outside
                document.addEventListener('click', (e) => {
                    const currentEmojiPicker = document.getElementById('emoji-picker');
                    const currentEmojiBtn = document.getElementById('emoji-btn');
                    
                    if (currentEmojiPicker && currentEmojiBtn && 
                        !currentEmojiPicker.contains(e.target) && 
                        !currentEmojiBtn.contains(e.target)) {
                        currentEmojiPicker.classList.add('hidden');
                    }
                });
                
                console.log('Emoji button event listener added successfully');
                return true;
            } else {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`Emoji elements not ready, retrying in 200ms... (${retryCount}/${maxRetries})`);
                    setTimeout(trySetupEmoji, 200);
                } else {
                    console.error('Failed to setup emoji picker after maximum retries');
                }
                return false;
            }
        };
        
        trySetupEmoji();
    }

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-status').textContent = this.currentUser.status || 'Online';
            document.getElementById('user-avatar').src = this.currentUser.avatar || 'https://via.placeholder.com/50';
        }
    }

    async loadFriends() {
        if (!this.currentUser) return;

        try {
            this.friends = await this.api.getFriends();
            this.renderFriendsList();
        } catch (error) {
            console.error('Error loading friends:', error);
            this.showNotification('Failed to load friends list', 'error');
        }
    }

    renderFriendsList() {
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';

        if (this.friends.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Friends Yet</h3>
                    <p>Add some friends to start chatting!</p>
                </div>
            `;
            return;
        }

        this.friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.dataset.friendId = friend.id;
            
            friendElement.innerHTML = `
                <img src="${friend.avatar || 'https://via.placeholder.com/50'}" alt="${friend.name}" class="friend-avatar">
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-status">${friend.status || 'Online'}</div>
                </div>
                <div class="friend-time">${this.getLastMessageTime(friend.id)}</div>
            `;

            friendElement.addEventListener('click', () => {
                this.selectFriend(friend);
            });

            friendsList.appendChild(friendElement);
        });
    }

    selectFriend(friend) {
        this.currentChat = friend;
        
        document.querySelectorAll('.friend-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-friend-id="${friend.id}"]`).classList.add('active');

        document.getElementById('chat-friend-name').textContent = friend.name;
        document.getElementById('chat-friend-status').textContent = friend.status || 'Online';
        document.getElementById('chat-avatar').src = friend.avatar || 'https://via.placeholder.com/40';

        document.getElementById('message-input').style.display = 'block';

        this.loadMessages(friend.id);
    }

    async loadMessages(friendId) {
        try {
            const messages = await this.api.getMessages(friendId);
            this.renderMessages(messages);
            
            // Mark received messages as read
            const receivedMessages = messages.filter(msg => 
                msg.receiver_id === this.currentUser.id && 
                !msg.read_at
            );
            
            for (const message of receivedMessages) {
                await this.markMessageAsRead(message.id);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.renderMessages([]);
        }
    }

    renderMessages(messages) {
        const messagesArea = document.getElementById('messages-area');
        messagesArea.innerHTML = '';

        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-comments"></i>
                    <h2>Start a conversation!</h2>
                    <p>Send your first message to ${this.currentChat.name}</p>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            const messageElement = this.displayMessage(message);
            messagesArea.appendChild(messageElement);
        });

        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender_id === this.currentUser.id ? 'sent' : 'received'}`;
        messageElement.setAttribute('data-message-id', message.id);
        
        let messageContent = '';
        
        // Handle different message types
        switch (message.message_type) {
            case 'image':
                messageContent = `
                    <div class="message-image">
                        <img src="${message.file_url}" alt="Image" onclick="app.openImageViewer('${message.file_url}')">
                    </div>
                `;
                break;
            case 'video':
                messageContent = `
                    <div class="message-video">
                        <video controls>
                            <source src="${message.file_url}" type="${message.file_type}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
                break;
            case 'document':
                messageContent = `
                    <div class="message-document">
                        <div class="document-info">
                            <i class="fas fa-file"></i>
                            <div class="document-details">
                                <div class="document-name">${message.file_name}</div>
                                <div class="document-size">${this.formatFileSize(message.file_size)}</div>
                            </div>
                        </div>
                        <a href="${message.file_url}" download="${message.file_name}" class="btn-download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                `;
                break;
            default:
                messageContent = `<div class="message-text">${this.escapeHtml(message.text)}</div>`;
        }
        
        // Add message status indicators for sent messages
        let statusIndicator = '';
        if (message.sender_id === this.currentUser.id) {
            // For temporary messages, show "sending" status
            if (message.id.toString().startsWith('temp_')) {
                statusIndicator = `
                    <div class="message-status">
                        <span class="status-text">sending...</span>
                    </div>
                `;
            } else {
                let statusText = '';
                let statusClass = '';
                
                if (message.read_at) {
                    statusText = 'seen';
                    statusClass = 'status-seen';
                } else if (message.delivered_at) {
                    statusText = 'delivered';
                    statusClass = 'status-delivered';
                } else {
                    statusText = 'sent';
                    statusClass = 'status-sent';
                }
                
                statusIndicator = `
                    <div class="message-status">
                        <i class="fas fa-check-double ${statusClass === 'status-seen' ? 'status-seen' : ''}"></i>
                        <span class="status-text ${statusClass}">${statusText}</span>
                    </div>
                `;
            }
        }
        
        // Format the time safely
        let formattedTime = 'Just now';
        try {
            formattedTime = this.formatMessageTime(message.created_at);
        } catch (error) {
            console.error('Error formatting message time:', error, 'Timestamp:', message.created_at);
        }
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${messageContent}
                <div class="message-time">${formattedTime}</div>
                ${statusIndicator}
            </div>
        `;
        
        return messageElement;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openImageViewer(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal image-viewer-modal';
        modal.innerHTML = `
            <div class="modal-content image-viewer-content">
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                <img src="${imageUrl}" alt="Full size image">
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-text');
        const text = messageInput.value.trim();
        
        if (!text || !this.currentChat) {
            if (!this.currentChat) {
                this.showNotification('Please select a friend to send a message', 'error');
            }
            return;
        }
        
        if (!this.currentUser) {
            this.showNotification('User not logged in', 'error');
            return;
        }
        
        // Debounce mechanism - prevent sending if last message was sent within 1 second
        const now = Date.now();
        if (now - this.lastMessageTime < 1000) {
            return; // Silently ignore if sending too quickly
        }
        
        if (this.isSendingMessage) {
            return; // Silently ignore if already sending
        }
        
        this.isSendingMessage = true;
        this.lastMessageTime = now;
        
        // Clear input immediately
        messageInput.value = '';
        
        // Create and display the message immediately for instant feedback
        const tempMessage = {
            id: 'temp_' + Date.now(),
            sender_id: this.currentUser.id,
            receiver_id: this.currentChat.id,
            text: text,
            message_type: 'text',
            created_at: new Date().toISOString(),
            delivered_at: null,
            read_at: null
        };
        
        // Add message to the chat immediately
        const messagesArea = document.getElementById('messages-area');
        const messageElement = this.displayMessage(tempMessage);
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        
        try {
            const messageData = {
                senderId: this.currentUser.id,
                receiverId: this.currentChat.id,
                text: text,
                messageType: 'text'
            };
            
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }
            
            const result = await response.json();
            
            // Update the temporary message with the real one
            const tempMessageElement = document.querySelector(`[data-message-id="${tempMessage.id}"]`);
            if (tempMessageElement) {
                // Update the message ID to the real one
                tempMessageElement.setAttribute('data-message-id', result.messageId);
                
                // Update the status to "sent"
                const statusElement = tempMessageElement.querySelector('.message-status');
                if (statusElement) {
                    statusElement.innerHTML = `
                        <i class="fas fa-check-double"></i>
                        <span class="status-text status-sent">sent</span>
                    `;
                }
            }
            
            // Mark message as delivered after 1 second
            setTimeout(() => {
                this.markMessageAsDelivered(result.messageId);
            }, 1000);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification(error.message || 'Failed to send message', 'error');
            
            // Remove the temporary message if sending failed
            const tempMessageElement = document.querySelector(`[data-message-id="${tempMessage.id}"]`);
            if (tempMessageElement) {
                tempMessageElement.remove();
            }
        } finally {
            this.isSendingMessage = false;
        }
    }

    async markMessageAsDelivered(messageId) {
        try {
            const response = await fetch('/api/messages/delivered', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messageId: messageId,
                    userId: this.currentUser.id
                })
            });

            if (response.ok) {
                // Update the message status in the UI immediately
                this.updateMessageStatus(messageId, 'delivered');
            }
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    }

    async markMessageAsRead(messageId) {
        try {
            const response = await fetch('/api/messages/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messageId: messageId,
                    userId: this.currentUser.id
                })
            });

            if (response.ok) {
                // Update the message status in the UI immediately
                this.updateMessageStatus(messageId, 'read');
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                let statusText = '';
                let statusClass = '';
                
                switch (status) {
                    case 'delivered':
                        statusText = 'delivered';
                        statusClass = 'status-delivered';
                        break;
                    case 'read':
                        statusText = 'seen';
                        statusClass = 'status-seen';
                        break;
                    default:
                        statusText = 'sent';
                        statusClass = 'status-sent';
                }
                
                // Update both the icon and text with proper classes
                statusElement.innerHTML = `
                    <i class="fas fa-check-double ${statusClass === 'status-seen' ? 'status-seen' : ''}"></i>
                    <span class="status-text ${statusClass}">${statusText}</span>
                `;
            }
        }
    }

    searchFriends(query) {
        const friendItems = document.querySelectorAll('.friend-item');
        
        friendItems.forEach(item => {
            const name = item.querySelector('.friend-name').textContent.toLowerCase();
            const status = item.querySelector('.friend-status').textContent.toLowerCase();
            const searchTerm = query.toLowerCase();

            if (name.includes(searchTerm) || status.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    openProfileModal() {
        if (this.currentUser) {
            document.getElementById('profile-name').value = this.currentUser.name;
            document.getElementById('profile-username').value = this.currentUser.username;
            document.getElementById('profile-email').value = this.currentUser.email || '';
            document.getElementById('profile-status').value = this.currentUser.status || '';
            document.getElementById('profile-avatar-preview').src = this.currentUser.avatar || 'https://via.placeholder.com/100';
        }
        document.getElementById('profile-modal').classList.remove('hidden');
    }

    closeProfileModal() {
        document.getElementById('profile-modal').classList.add('hidden');
    }

    openAddFriendModal() {
        document.getElementById('add-friend-modal').classList.remove('hidden');
    }

    closeAddFriendModal() {
        document.getElementById('add-friend-modal').classList.add('hidden');
        document.getElementById('friend-identifier').value = '';
    }

    openNotificationsModal() {
        document.getElementById('notifications-modal').classList.remove('hidden');
        this.loadNotifications();
    }

    closeNotificationsModal() {
        document.getElementById('notifications-modal').classList.add('hidden');
    }

    openFriendRequestsModal() {
        document.getElementById('friend-requests-modal').classList.remove('hidden');
        this.loadFriendRequests();
    }

    closeFriendRequestsModal() {
        document.getElementById('friend-requests-modal').classList.add('hidden');
    }

    async updateProfile() {
        const name = document.getElementById('profile-name').value;
        const username = document.getElementById('profile-username').value;
        const email = document.getElementById('profile-email').value;
        const status = document.getElementById('profile-status').value;

        if (!name || !username || !email) {
            this.showNotification('Please fill in required fields', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            this.showNotification('Username must be 3-20 characters, letters, numbers, and underscores only', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            // For now, we'll just update the local user object
            // In a real app, you'd have an API endpoint to update profile
            this.currentUser.name = name;
            this.currentUser.username = username;
            this.currentUser.email = email;
            this.currentUser.status = status;

            this.api.setCurrentUser(this.currentUser);
            this.updateUserInfo();
            this.closeProfileModal();
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Failed to update profile', 'error');
        }
    }

    async addFriend() {
        const username = document.getElementById('friend-identifier').value.trim();

        if (!username) {
            this.showNotification('Please enter a username', 'error');
            return;
        }

        try {
            const response = await this.api.sendFriendRequest(username);
            
            if (response.success) {
                this.closeAddFriendModal();
                this.showNotification(`Friend request sent to ${response.receiver.name}!`, 'success');
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            this.showNotification(error.message || 'Failed to add friend', 'error');
        }
    }

    async loadNotifications() {
        try {
            const notifications = await this.api.getNotifications();
            const friendRequests = await this.api.getFriendRequests();
            
            this.renderNotifications(notifications);
            this.updateNotificationBadge(notifications);
            this.updateFriendRequestsBadge(friendRequests);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications(notifications) {
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '';

        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <h3>No Notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }

        notifications.forEach(notification => {
            const notificationElement = this.displayNotification(notification);
            notificationsList.appendChild(notificationElement);
        });
    }

    displayNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        
        const timeAgo = this.formatMessageTime(notification.created_at);
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-text">${notification.message}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            ${!notification.read ? '<div class="notification-dot"></div>' : ''}
        `;
        
        return notificationElement;
    }

    updateNotificationBadge(notifications) {
        const badge = document.getElementById('notification-badge');
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    updateFriendRequestsBadge(friendRequests) {
        const badge = document.getElementById('friend-requests-badge');
        const pendingCount = friendRequests.length;
        
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await this.api.markNotificationAsRead(notificationId);
            this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async loadFriendRequests() {
        try {
            const requests = await this.api.getFriendRequests();
            this.renderFriendRequests(requests);
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    }

    renderFriendRequests(requests) {
        const requestsList = document.getElementById('friend-requests-list');
        requestsList.innerHTML = '';

        if (requests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <h3>No Friend Requests</h3>
                    <p>You don't have any pending friend requests.</p>
                </div>
            `;
            return;
        }

        requests.forEach(request => {
            const requestElement = this.displayFriendRequest(request);
            requestsList.appendChild(requestElement);
        });
    }

    displayFriendRequest(request) {
        const requestElement = document.createElement('div');
        requestElement.className = 'friend-request-item';
        requestElement.dataset.requestId = request.id;
        
        const timeAgo = this.formatMessageTime(request.created_at);
        
        requestElement.innerHTML = `
            <div class="request-info">
                <div class="request-user">
                    <img src="https://via.placeholder.com/40" alt="Profile" class="avatar">
                    <div>
                        <div class="request-name">${request.sender_username}</div>
                        <div class="request-time">${timeAgo}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn-primary btn-sm" onclick="app.acceptFriendRequest(${request.id})">Accept</button>
                    <button class="btn-secondary btn-sm" onclick="app.rejectFriendRequest(${request.id})">Reject</button>
                </div>
            </div>
        `;
        
        return requestElement;
    }

    async acceptFriendRequest(requestId) {
        try {
            await this.api.acceptFriendRequest(requestId);
            this.loadFriendRequests();
            this.loadFriends();
            this.showNotification('Friend request accepted!', 'success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            this.showNotification('Failed to accept friend request', 'error');
        }
    }

    async rejectFriendRequest(requestId) {
        try {
            await this.api.rejectFriendRequest(requestId);
            this.loadFriendRequests();
            this.showNotification('Friend request rejected', 'info');
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            this.showNotification('Failed to reject friend request', 'error');
        }
    }

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        fetch('/api/avatar-upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update avatar in database
                return fetch('/api/update-avatar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        avatarUrl: data.avatarUrl
                    })
                });
            } else {
                throw new Error(data.error);
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update UI
                this.currentUser.avatar = data.avatarUrl;
                this.updateUserInfo();
                this.showNotification('Avatar updated successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Avatar upload error:', error);
            this.showNotification('Failed to upload avatar', 'error');
        });
    }

    async getLastMessageTime(friendId) {
        try {
            const messages = await this.api.getMessages(friendId);
            
            if (messages.length === 0) return '';
            
            const lastMessage = messages[messages.length - 1];
            return this.formatTime(lastMessage.created_at);
        } catch (error) {
            return '';
        }
    }

    formatTime(timestamp) {
        try {
            let date;
            
            // Handle different timestamp formats
            if (typeof timestamp === 'string') {
                // If it's already a valid ISO string, use it directly
                if (timestamp.includes('T') && timestamp.includes('Z')) {
                    date = new Date(timestamp);
                } else {
                    // If it's a timestamp without timezone info, assume it's local
                    date = new Date(timestamp);
                }
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                // Fallback to current time
                date = new Date();
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);
            
            // Format based on how recent the message is
            if (diffInHours < 24) {
                // Today - show time only
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            } else if (diffInHours < 48) {
                // Yesterday
                return `Yesterday at ${date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })}`;
            } else if (diffInHours < 168) { // 7 days
                // This week - show day and time
                return date.toLocaleDateString('en-US', {
                    weekday: 'short'
                }) + ' ' + date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            } else {
                // Older - show full date and time
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }) + ' ' + date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    }

    formatMessageTime(timestamp) {
        try {
            let date;
            
            // Handle different timestamp formats
            if (typeof timestamp === 'string') {
                // If it's already a valid ISO string, use it directly
                if (timestamp.includes('T') && timestamp.includes('Z')) {
                    date = new Date(timestamp);
                } else {
                    // If it's a timestamp without timezone info, assume it's local
                    date = new Date(timestamp);
                }
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                // Fallback to current time
                date = new Date();
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Just now';
            }
            
            const now = new Date();
            const diffInMinutes = (now - date) / (1000 * 60);
            
            // Format time with timezone
            const timeString = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: this.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            if (diffInMinutes < 1) {
                return 'Just now';
            } else if (diffInMinutes < 60) {
                return `${Math.floor(diffInMinutes)}m ago`;
            } else if (diffInMinutes < 1440) { // 24 hours
                const hours = Math.floor(diffInMinutes / 60);
                return `${hours}h ago`;
            } else {
                const dateString = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: this.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                });
                return dateString;
            }
        } catch (error) {
            console.error('Error formatting message time:', error);
            return 'Just now';
        }
    }

    getTimezoneAbbreviation() {
        try {
            const timezone = this.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const date = new Date();
            const options = { timeZoneName: 'short' };
            const timeString = date.toLocaleString('en-US', { timeZone: timezone, ...options });
            
            // Extract timezone abbreviation from the string
            const timezoneMatch = timeString.match(/\s([A-Z]{3,4})$/);
            if (timezoneMatch) {
                return timezoneMatch[1];
            }
            
            // Fallback: extract from timezone name
            const timezoneParts = timezone.split('/');
            if (timezoneParts.length > 1) {
                return timezoneParts[timezoneParts.length - 1].substring(0, 3).toUpperCase();
            }
            
            return timezone.substring(0, 3).toUpperCase();
        } catch (error) {
            console.error('Error getting timezone abbreviation:', error);
            return 'UTC';
        }
    }

    getCurrentTimeInTimezone() {
        try {
            const timezone = this.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            return new Date().toLocaleString('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Error getting current time in timezone:', error);
            return new Date().toISOString();
        }
    }

    startNotificationPolling() {
        this.notificationInterval = setInterval(async () => {
            if (this.currentUser) {
                // Check for new notifications
                await this.loadNotifications();
                
                // Check for new messages and status updates
                if (this.currentChat) {
                    await this.checkForNewMessages();
                }
            }
        }, 3000); // Check every 3 seconds
    }

    async checkForNewMessages() {
        try {
            const messages = await this.api.getMessages(this.currentChat.id);
            this.updateMessagesInRealTime(messages);
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }

    updateMessagesInRealTime(messages) {
        const messagesArea = document.getElementById('messages-area');
        const currentMessages = messagesArea.querySelectorAll('.message');
        
        // Update existing messages with new statuses
        messages.forEach(serverMessage => {
            const existingMessage = messagesArea.querySelector(`[data-message-id="${serverMessage.id}"]`);
            if (existingMessage) {
                // Update status if it has changed
                const statusElement = existingMessage.querySelector('.message-status');
                if (statusElement) {
                    let statusText = '';
                    let statusClass = '';
                    
                    if (serverMessage.read_at) {
                        statusText = 'seen';
                        statusClass = 'status-seen';
                    } else if (serverMessage.delivered_at) {
                        statusText = 'delivered';
                        statusClass = 'status-delivered';
                    } else {
                        statusText = 'sent';
                        statusClass = 'status-sent';
                    }
                    
                    const currentStatus = statusElement.querySelector('.status-text').textContent;
                    if (currentStatus !== statusText) {
                        statusElement.innerHTML = `
                            <i class="fas fa-check-double ${statusClass === 'status-seen' ? 'status-seen' : ''}"></i>
                            <span class="status-text ${statusClass}">${statusText}</span>
                        `;
                    }
                }
            } else {
                // Add new message if it doesn't exist and it's from the other person
                if (serverMessage.sender_id !== this.currentUser.id) {
                    const messageElement = this.displayMessage(serverMessage);
                    messagesArea.appendChild(messageElement);
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
            }
        });
    }

    stopNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async markAllNotificationsAsRead() {
        try {
            await this.api.markAllNotificationsAsRead();
            this.loadNotifications();
            this.showNotification('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            this.showNotification('Failed to mark all notifications as read', 'error');
        }
    }

    loadEmojis() {
        console.log('loadEmojis called');
        const emojiList = document.getElementById('emoji-list');
        if (!emojiList) {
            console.error('Emoji list element not found');
            return;
        }
        
        console.log('Emoji list element found:', emojiList);
        
        const emojis = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄'],
            food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🥜'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷'],
            travel: ['✈️', '🛩️', '🛫', '🛬', '🛥️', '🚢', '⛴️', '🛳️', '🚤', '🚣', '⛵', '🛶', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧭', '🕰️', '⏰', '⏱️', '⏲️', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘']
        };
        
        // Get active category or default to smileys
        const activeCategoryElement = document.querySelector('.emoji-category.active');
        console.log('Active category element:', activeCategoryElement);
        
        const activeCategory = activeCategoryElement ? activeCategoryElement.dataset.category : 'smileys';
        const categoryEmojis = emojis[activeCategory] || emojis.smileys;
        
        console.log('Active category:', activeCategory);
        console.log('Category emojis count:', categoryEmojis.length);
        
        // Populate emoji list
        emojiList.innerHTML = categoryEmojis.map(emoji => 
            `<button class="emoji-btn" onclick="app.insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
        
        console.log('Emoji list populated with', categoryEmojis.length, 'emojis');
        console.log('Emoji list HTML:', emojiList.innerHTML.substring(0, 200) + '...');
        
        // Add category switching event listeners
        document.querySelectorAll('.emoji-category').forEach(btn => {
            console.log('Setting up category button:', btn.dataset.category);
            
            // Remove existing event listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add new event listener
            newBtn.addEventListener('click', () => {
                console.log('Category button clicked:', newBtn.dataset.category);
                document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                this.loadEmojis();
            });
        });
        
        console.log('Category switching event listeners added');
    }

    insertEmoji(emoji) {
        console.log('insertEmoji called with:', emoji);
        const messageInput = document.getElementById('message-text');
        console.log('Message input element found:', messageInput);
        
        if (messageInput) {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            messageInput.value = textBefore + emoji + textAfter;
            messageInput.focus();
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
            console.log('Emoji inserted successfully');
        } else {
            console.error('Message input element not found');
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('File upload error:', error);
            this.showNotification(`Upload failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async sendFileMessage(fileUrl, fileName, fileSize, fileType, messageType) {
        if (!this.currentChat) {
            this.showNotification('Please select a friend to send the file', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: this.currentUser.id,
                    receiverId: this.currentChat.id,
                    messageType: messageType,
                    fileUrl: fileUrl,
                    fileName: fileName,
                    fileSize: fileSize,
                    fileType: fileType
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send file message');
            }
            
            const result = await response.json();
            this.loadMessages(this.currentChat.id);
            this.showNotification('File sent successfully', 'success');
            
        } catch (error) {
            console.error('Error sending file message:', error);
            this.showNotification(error.message || 'Failed to send file', 'error');
        }
    }

    cancelFileUpload() {
        const uploadProgress = document.getElementById('upload-progress');
        const fileInput = document.getElementById('file-input');
        
        if (uploadProgress) {
            uploadProgress.classList.add('hidden');
        }
        if (fileInput) {
            fileInput.value = '';
        }
    }

    showTimezoneInfo() {
        // This method is called but not needed since we update timezone display in updateTimezoneDisplay
        this.updateTimezoneDisplay();
    }

    toggleChatMenu() {
        const chatMenu = document.getElementById('chat-menu-dropdown');
        chatMenu.classList.toggle('hidden');
    }

    async unfriendCurrentChat() {
        if (!this.currentChat) {
            this.showNotification('No friend selected', 'error');
            return;
        }

        const confirmed = confirm(`Are you sure you want to unfriend ${this.currentChat.name}?`);
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('/api/unfriend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    friendId: this.currentChat.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to unfriend');
            }

            // Remove from friends list
            this.friends = this.friends.filter(friend => friend.id !== this.currentChat.id);
            this.renderFriendsList();

            // Clear current chat
            this.currentChat = null;
            document.getElementById('chat-friend-name').textContent = 'Select a friend';
            document.getElementById('chat-friend-status').textContent = 'Online';
            document.getElementById('messages-area').innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-comments"></i>
                    <h2>Start a conversation!</h2>
                    <p>Select a friend to start chatting</p>
                </div>
            `;

            this.showNotification(`${this.currentChat.name} has been unfriended`, 'success');
            this.toggleChatMenu();
        } catch (error) {
            console.error('Error unfriending:', error);
            this.showNotification('Failed to unfriend', 'error');
        }
    }

    async showFileUploadConfirmation(file) {
        return new Promise((resolve) => {
            // Create modal for file confirmation
            const modal = document.createElement('div');
            modal.className = 'modal file-confirmation-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            // Determine file type and create appropriate preview
            let previewContent = '';
            let fileType = 'Document';
            
            if (file.type.startsWith('image/')) {
                fileType = 'Image';
                previewContent = `<img src="${URL.createObjectURL(file)}" alt="Preview" style="max-width: 300px; max-height: 300px; border-radius: 8px;">`;
            } else if (file.type.startsWith('video/')) {
                fileType = 'Video';
                previewContent = `
                    <video controls style="max-width: 300px; max-height: 300px; border-radius: 8px;">
                        <source src="${URL.createObjectURL(file)}" type="${file.type}">
                        Your browser does not support video preview.
                    </video>
                `;
            } else {
                fileType = 'Document';
                previewContent = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-file" style="font-size: 64px; color: #667eea; margin-bottom: 20px;"></i>
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${file.name}</div>
                        <div style="color: #666;">${this.formatFileSize(file.size)}</div>
                    </div>
                `;
            }
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                ">
                    <h3 style="margin-bottom: 20px; color: #333;">Send ${fileType}?</h3>
                    <div style="margin-bottom: 20px;">
                        ${previewContent}
                    </div>
                    <div style="margin-bottom: 20px; text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 5px;"><strong>File:</strong> ${file.name}</div>
                        <div style="margin-bottom: 5px;"><strong>Size:</strong> ${this.formatFileSize(file.size)}</div>
                        <div><strong>Type:</strong> ${file.type || 'Unknown'}</div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="confirm-upload" style="
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Send File</button>
                        <button id="cancel-upload" style="
                            background: #f0f2f5;
                            color: #333;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            const confirmBtn = modal.querySelector('#confirm-upload');
            const cancelBtn = modal.querySelector('#cancel-upload');
            
            confirmBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ChatApp();
});