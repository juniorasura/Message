// Database Manager using IndexedDB
class DatabaseManager {
    constructor() {
        this.dbName = 'ChatAppDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Create messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messageStore.createIndex('chatId', 'chatId', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create friendships store
                if (!db.objectStoreNames.contains('friendships')) {
                    const friendshipStore = db.createObjectStore('friendships', { keyPath: 'id', autoIncrement: true });
                    friendshipStore.createIndex('userId', 'userId', { unique: false });
                    friendshipStore.createIndex('friendId', 'friendId', { unique: false });
                    friendshipStore.createIndex('uniquePair', ['userId', 'friendId'], { unique: true });
                }

                console.log('Database schema created');
            };
        });
    }

    // User operations
    async createUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.add(user);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('username');
            const request = index.get(username);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteUser(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Message operations
    async addMessage(message) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            const request = store.add(message);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getMessagesByChatId(chatId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('chatId');
            const request = index.getAll(chatId);

            request.onsuccess = () => {
                const messages = request.result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMessagesByChatId(chatId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            const index = store.index('chatId');
            const request = index.getAllKeys(chatId);

            request.onsuccess = () => {
                const keys = request.result;
                const deletePromises = keys.map(key => {
                    return new Promise((res, rej) => {
                        const deleteRequest = store.delete(key);
                        deleteRequest.onsuccess = () => res();
                        deleteRequest.onerror = () => rej(deleteRequest.error);
                    });
                });
                Promise.all(deletePromises).then(resolve).catch(reject);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Friendship operations
    async addFriendship(userId, friendId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['friendships'], 'readwrite');
            const store = transaction.objectStore('friendships');
            const friendship = {
                userId: userId,
                friendId: friendId,
                createdAt: new Date().toISOString()
            };
            const request = store.add(friendship);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFriendshipsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['friendships'], 'readonly');
            const store = transaction.objectStore('friendships');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeFriendship(userId, friendId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['friendships'], 'readwrite');
            const store = transaction.objectStore('friendships');
            const index = store.index('uniquePair');
            const request = index.getKey([userId, friendId]);

            request.onsuccess = () => {
                if (request.result) {
                    const deleteRequest = store.delete(request.result);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Database management
    async clearDatabase() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users', 'messages', 'friendships'], 'readwrite');
            
            const userStore = transaction.objectStore('users');
            const messageStore = transaction.objectStore('messages');
            const friendshipStore = transaction.objectStore('friendships');

            const userRequest = userStore.clear();
            const messageRequest = messageStore.clear();
            const friendshipRequest = friendshipStore.clear();

            Promise.all([
                new Promise((res, rej) => {
                    userRequest.onsuccess = () => res();
                    userRequest.onerror = () => rej(userRequest.error);
                }),
                new Promise((res, rej) => {
                    messageRequest.onsuccess = () => res();
                    messageRequest.onerror = () => rej(messageRequest.error);
                }),
                new Promise((res, rej) => {
                    friendshipRequest.onsuccess = () => res();
                    friendshipRequest.onerror = () => rej(friendshipRequest.error);
                })
            ]).then(resolve).catch(reject);
        });
    }

    async initializeSampleData() {
        try {
            // Clear existing data
            await this.clearDatabase();

            // Create sample users
            const sampleUsers = [
                {
                    id: '1',
                    name: 'John Doe',
                    username: 'johndoe',
                    phone: '',
                    email: 'john@example.com',
                    password: '123456',
                    avatar: 'https://via.placeholder.com/50/667eea/ffffff?text=J',
                    status: 'Available',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    username: 'janesmith',
                    phone: '',
                    email: 'jane@example.com',
                    password: '123456',
                    avatar: 'https://via.placeholder.com/50/764ba2/ffffff?text=J',
                    status: 'At work',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'Mike Johnson',
                    username: 'mikejohnson',
                    phone: '',
                    email: 'mike@example.com',
                    password: '123456',
                    avatar: 'https://via.placeholder.com/50/667eea/ffffff?text=M',
                    status: 'In a meeting',
                    createdAt: new Date().toISOString()
                }
            ];

            // Add users to database
            for (const user of sampleUsers) {
                await this.createUser(user);
            }

            // Create sample messages
            const sampleMessages = [
                {
                    chatId: '1_current',
                    senderId: '1',
                    receiverId: 'current',
                    text: 'Hey! How are you?',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '1_current',
                    senderId: 'current',
                    receiverId: '1',
                    text: 'I\'m good, thanks! How about you?',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '1_current',
                    senderId: '1',
                    receiverId: 'current',
                    text: 'Great! Want to grab coffee later?',
                    timestamp: new Date(Date.now() - 900000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '2_current',
                    senderId: '2',
                    receiverId: 'current',
                    text: 'Hi there!',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '2_current',
                    senderId: 'current',
                    receiverId: '2',
                    text: 'Hello! How\'s work going?',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '3_current',
                    senderId: 'current',
                    receiverId: '3',
                    text: 'Hey Mike!',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    type: 'text'
                },
                {
                    chatId: '3_current',
                    senderId: '3',
                    receiverId: 'current',
                    text: 'Hi! What\'s up?',
                    timestamp: new Date(Date.now() - 900000).toISOString(),
                    type: 'text'
                }
            ];

            // Add messages to database
            for (const message of sampleMessages) {
                await this.addMessage(message);
            }

            // Create sample friendships
            const sampleFriendships = [
                { userId: '1', friendId: '2' },
                { userId: '1', friendId: '3' },
                { userId: '2', friendId: '1' },
                { userId: '2', friendId: '3' },
                { userId: '3', friendId: '1' },
                { userId: '3', friendId: '2' }
            ];

            // Add friendships to database
            for (const friendship of sampleFriendships) {
                await this.addFriendship(friendship.userId, friendship.friendId);
            }

            console.log('Sample data initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing sample data:', error);
            return false;
        }
    }

    async getDatabaseStats() {
        try {
            const users = await this.getAllUsers();
            const userCount = users.length;
            
            // Get message count
            const transaction = this.db.transaction(['messages'], 'readonly');
            const messageStore = transaction.objectStore('messages');
            const messageCount = await new Promise((resolve, reject) => {
                const request = messageStore.count();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Get friendship count
            const friendshipTransaction = this.db.transaction(['friendships'], 'readonly');
            const friendshipStore = friendshipTransaction.objectStore('friendships');
            const friendshipCount = await new Promise((resolve, reject) => {
                const request = friendshipStore.count();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return {
                users: userCount,
                messages: messageCount,
                friendships: friendshipCount
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return null;
        }
    }
}

// Export for use in other files
window.DatabaseManager = DatabaseManager; 