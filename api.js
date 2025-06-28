// API Service for ChatApp
class ApiService {
    constructor() {
        // Initialize baseUrl as null, will be set when needed
        this.baseUrl = null;
        this.currentUser = null;
    }

    // Get the appropriate API base URL based on current location
    getApiBaseUrl() {
        // If baseUrl is already set, return it
        if (this.baseUrl) {
            return this.baseUrl;
        }

        const currentHost = window.location.hostname;
        
        // If accessing from localhost, use localhost:3000
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.baseUrl = 'http://localhost:3000/api';
            return this.baseUrl;
        }
        
        // If accessing from GitHub Pages or any other domain, use the configured server
        if (typeof ChatAppConfig !== 'undefined') {
            this.baseUrl = ChatAppConfig.getServerUrl();
            console.log('Using ChatAppConfig server URL:', this.baseUrl);
            return this.baseUrl;
        } else {
            // Fallback to network server if config is not available
            console.warn('ChatAppConfig not found, using fallback URL');
            this.baseUrl = 'http://192.168.18.6:3000/api';
            return this.baseUrl;
        }
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                this.currentUser = JSON.parse(saved);
            }
        }
        return this.currentUser;
    }

    // Clear current user
    clearCurrentUser() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Generic API request
    async makeRequest(endpoint, options = {}) {
        const url = `${this.getApiBaseUrl()}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User registration
    async register(userData) {
        const response = await this.makeRequest('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            this.setCurrentUser(response.user);
        }
        
        return response;
    }

    // User login
    async login(credentials) {
        const response = await this.makeRequest('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.success) {
            this.setCurrentUser(response.user);
        }
        
        return response;
    }

    // Get all users
    async getAllUsers() {
        return await this.makeRequest('/users');
    }

    // Send friend request
    async sendFriendRequest(receiverUsername) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/friend-request', {
            method: 'POST',
            body: JSON.stringify({
                senderId: user.id,
                receiverUsername: receiverUsername,
                senderName: user.name
            })
        });
    }

    // Get friend requests
    async getFriendRequests() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest(`/friend-requests/${user.id}`);
    }

    // Accept friend request
    async acceptFriendRequest(requestId) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/friend-request/accept', {
            method: 'POST',
            body: JSON.stringify({
                requestId: requestId,
                userId: user.id
            })
        });
    }

    // Reject friend request
    async rejectFriendRequest(requestId) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/friend-request/reject', {
            method: 'POST',
            body: JSON.stringify({
                requestId: requestId,
                userId: user.id
            })
        });
    }

    // Get friends
    async getFriends() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest(`/friends/${user.id}`);
    }

    // Get notifications
    async getNotifications() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest(`/notifications/${user.id}`);
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/notifications/read', {
            method: 'POST',
            body: JSON.stringify({
                notificationId: notificationId,
                userId: user.id
            })
        });
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/notifications/read-all', {
            method: 'POST',
            body: JSON.stringify({
                userId: user.id
            })
        });
    }

    // Get messages between two users
    async getMessages(friendId) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest(`/messages/${user.id}/${friendId}`);
    }

    // Send message
    async sendMessage(receiverId, text) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        return await this.makeRequest('/messages', {
            method: 'POST',
            body: JSON.stringify({
                senderId: user.id,
                receiverId: receiverId,
                text: text,
                messageType: 'text'
            })
        });
    }

    // Check server connection
    async checkConnection() {
        try {
            const response = await fetch(`${this.getApiBaseUrl()}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.error('Server connection check failed:', error);
            return false;
        }
    }
}

// Export for use in other files
window.ApiService = ApiService; 