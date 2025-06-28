const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images, videos, documents, and GIFs
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv', 'application/zip', 'application/rar', 'application/x-rar-compressed',
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/mp4'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.log('File type rejected:', file.mimetype, file.originalname);
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const db = new sqlite3.Database('chatapp.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'Hey there! I am using ChatApp',
            avatar TEXT DEFAULT 'https://via.placeholder.com/50',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Friend requests table
        db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id),
            UNIQUE(sender_id, receiver_id)
        )`);

        // Friendships table
        db.run(`CREATE TABLE IF NOT EXISTS friendships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (friend_id) REFERENCES users (id),
            UNIQUE(user_id, friend_id)
        )`);

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text TEXT,
            message_type TEXT DEFAULT 'text',
            file_url TEXT,
            file_name TEXT,
            file_size INTEGER,
            file_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            delivered_at DATETIME,
            read_at DATETIME,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
        )`);

        // Notifications table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Add missing columns to existing messages table
        db.run(`ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding message_type column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN file_url TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding file_url column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN file_name TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding file_name column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN file_size INTEGER`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding file_size column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN file_type TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding file_type column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN delivered_at DATETIME`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding delivered_at column:', err);
            }
        });

        db.run(`ALTER TABLE messages ADD COLUMN read_at DATETIME`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding read_at column:', err);
            }
        });

        // Insert sample data if database is empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
                console.error('Error checking users count:', err);
                return;
            }
            
            if (row.count === 0) {
                insertSampleData();
            }
        });
    });
}

// Insert sample data
function insertSampleData() {
    const sampleUsers = [
        {
            username: 'johndoe',
            email: 'john@example.com',
            password: bcrypt.hashSync('123456', 10),
            name: 'John Doe',
            status: 'Available'
        },
        {
            username: 'janesmith',
            email: 'jane@example.com',
            password: bcrypt.hashSync('123456', 10),
            name: 'Jane Smith',
            status: 'At work'
        },
        {
            username: 'mikejohnson',
            email: 'mike@example.com',
            password: bcrypt.hashSync('123456', 10),
            name: 'Mike Johnson',
            status: 'In a meeting'
        }
    ];

    // Insert users one by one
    sampleUsers.forEach((user, index) => {
        db.run(
            'INSERT INTO users (username, email, password, name, status) VALUES (?, ?, ?, ?, ?)',
            [user.username, user.email, user.password, user.name, user.status],
            function(err) {
                if (err) {
                    console.error('Error inserting sample user:', err);
                } else {
                    console.log(`Inserted user: ${user.username}`);
                }
                
                // If this is the last user, create sample friendships
                if (index === sampleUsers.length - 1) {
                    createSampleFriendships();
                }
            }
        );
    });
}

// Create sample friendships
function createSampleFriendships() {
    const friendships = [
        { user_id: 1, friend_id: 2 },
        { user_id: 1, friend_id: 3 },
        { user_id: 2, friend_id: 1 },
        { user_id: 2, friend_id: 3 },
        { user_id: 3, friend_id: 1 },
        { user_id: 3, friend_id: 2 }
    ];

    friendships.forEach(friendship => {
        db.run(
            'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)',
            [friendship.user_id, friendship.friend_id],
            function(err) {
                if (err) {
                    console.error('Error inserting friendship:', err);
                }
            }
        );
    });

    console.log('Sample data inserted successfully');
    
    // Add sample messages
    const sampleMessages = [
        { sender_id: 1, receiver_id: 2, text: 'Hey Jane! How are you doing?' },
        { sender_id: 2, receiver_id: 1, text: 'Hi John! I\'m doing great, thanks for asking!' },
        { sender_id: 1, receiver_id: 3, text: 'Mike, are you free for lunch tomorrow?' },
        { sender_id: 3, receiver_id: 1, text: 'Sure! What time works for you?' },
        { sender_id: 2, receiver_id: 3, text: 'Mike, did you finish the project?' },
        { sender_id: 3, receiver_id: 2, text: 'Yes, just sent it to you!' }
    ];

    sampleMessages.forEach(message => {
        db.run(
            'INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)',
            [message.sender_id, message.receiver_id, message.text],
            function(err) {
                if (err) {
                    console.error('Error inserting sample message:', err);
                }
            }
        );
    });
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// User registration
app.post('/api/register', (req, res) => {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Use username as display name if no name is provided
    const displayName = name || username;

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, displayName],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('username')) {
                        return res.status(400).json({ error: 'Username already taken' });
                    } else if (err.message.includes('email')) {
                        return res.status(400).json({ error: 'Email already registered' });
                    }
                }
                return res.status(500).json({ error: 'Registration failed' });
            }

            // Get the created user
            db.get('SELECT id, username, email, name, status, avatar FROM users WHERE id = ?', [this.lastID], (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to get user data' });
                }
                res.json({ success: true, user });
            });
        }
    );
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            if (!bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
        }
    );
});

// Get all users (for friend requests)
app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, email, name, status, avatar FROM users', (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get users' });
        }
        res.json(users);
    });
});

// Send friend request
app.post('/api/friend-request', (req, res) => {
    const { senderId, receiverUsername } = req.body;

    if (!senderId || !receiverUsername) {
        return res.status(400).json({ error: 'Sender ID and receiver username are required' });
    }

    // First, get the receiver user
    db.get('SELECT * FROM users WHERE username = ?', [receiverUsername], (err, receiver) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to find user' });
        }

        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (senderId == receiver.id) {
            return res.status(400).json({ error: 'You cannot send friend request to yourself' });
        }

        // Check if friend request already exists
        db.get(
            'SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?',
            [senderId, receiver.id],
            (err, existingRequest) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to check friend request' });
                }

                if (existingRequest) {
                    return res.status(400).json({ error: 'Friend request already sent' });
                }

                // Check if already friends
                db.get(
                    'SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                    [senderId, receiver.id, receiver.id, senderId],
                    (err, existingFriendship) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to check friendship' });
                        }

                        if (existingFriendship) {
                            return res.status(400).json({ error: 'Already friends with this user' });
                        }

                        // Create friend request
                        db.run(
                            'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
                            [senderId, receiver.id],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to send friend request' });
                                }

                                // Create notification for receiver
                                db.run(
                                    'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
                                    [receiver.id, 'friend_request', 'New Friend Request', `You have a new friend request from ${req.body.senderName || 'a user'}`],
                                    (err) => {
                                        if (err) {
                                            console.error('Failed to create notification:', err);
                                        }
                                    }
                                );

                                res.json({ 
                                    success: true, 
                                    message: 'Friend request sent successfully',
                                    receiver: {
                                        id: receiver.id,
                                        username: receiver.username,
                                        name: receiver.name
                                    }
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// Get friend requests for a user
app.get('/api/friend-requests/:userId', (req, res) => {
    const { userId } = req.params;

    db.all(`
        SELECT fr.*, u.username, u.name, u.avatar 
        FROM friend_requests fr 
        JOIN users u ON fr.sender_id = u.id 
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
    `, [userId], (err, requests) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get friend requests' });
        }
        res.json(requests);
    });
});

// Accept friend request
app.post('/api/friend-request/accept', (req, res) => {
    const { requestId, userId } = req.body;

    db.get('SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?', [requestId, userId], (err, request) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get friend request' });
        }

        if (!request) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Create friendship
        db.run(
            'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)',
            [request.sender_id, request.receiver_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create friendship' });
                }

                // Create the reverse friendship
                db.run(
                    'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)',
                    [request.receiver_id, request.sender_id],
                    function(err2) {
                        if (err2) {
                            console.error('Failed to create reverse friendship:', err2);
                        }

                        // Update friend request status
                        db.run('UPDATE friend_requests SET status = ? WHERE id = ?', ['accepted', requestId], (err) => {
                            if (err) {
                                console.error('Failed to update friend request status:', err);
                            }
                        });

                        // Create notification for sender
                        db.run(
                            'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
                            [request.sender_id, 'friend_accepted', 'Friend Request Accepted', 'Your friend request has been accepted!'],
                            (err) => {
                                if (err) {
                                    console.error('Failed to create notification:', err);
                                }
                            }
                        );

                        res.json({ success: true, message: 'Friend request accepted' });
                    }
                );
            }
        );
    });
});

// Reject friend request
app.post('/api/friend-request/reject', (req, res) => {
    const { requestId, userId } = req.body;

    db.run('UPDATE friend_requests SET status = ? WHERE id = ? AND receiver_id = ?', ['rejected', requestId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to reject friend request' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        res.json({ success: true, message: 'Friend request rejected' });
    });
});

// Get friends for a user
app.get('/api/friends/:userId', (req, res) => {
    const { userId } = req.params;

    db.all(`
        SELECT u.id, u.username, u.name, u.status, u.avatar, f.created_at as friendship_date
        FROM friendships f 
        JOIN users u ON (f.friend_id = u.id) 
        WHERE f.user_id = ?
        ORDER BY u.name
    `, [userId], (err, friends) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get friends' });
        }
        res.json(friends);
    });
});

// Get notifications for a user
app.get('/api/notifications/:userId', (req, res) => {
    const { userId } = req.params;

    db.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
    `, [userId], (err, notifications) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get notifications' });
        }
        res.json(notifications);
    });
});

// Mark notification as read
app.post('/api/notifications/read', (req, res) => {
    const { notificationId, userId } = req.body;

    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to mark notification as read' });
        }
        res.json({ success: true });
    });
});

// Mark all notifications as read
app.post('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;

    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to mark all notifications as read' });
        }
        res.json({ success: true, updatedCount: this.changes });
    });
});

// Get messages between two users
app.get('/api/messages/:userId/:friendId', (req, res) => {
    const { userId, friendId } = req.params;

    db.all(`
        SELECT 
            id,
            sender_id,
            receiver_id,
            text,
            message_type,
            file_url,
            file_name,
            file_size,
            file_type,
            datetime(created_at, 'localtime') as created_at,
            datetime(delivered_at, 'localtime') as delivered_at,
            datetime(read_at, 'localtime') as read_at
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `, [userId, friendId, friendId, userId], (err, messages) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get messages' });
        }
        
        // Convert SQLite datetime strings to ISO format
        const formattedMessages = messages.map(message => ({
            ...message,
            created_at: message.created_at ? new Date(message.created_at).toISOString() : null,
            delivered_at: message.delivered_at ? new Date(message.delivered_at).toISOString() : null,
            read_at: message.read_at ? new Date(message.read_at).toISOString() : null
        }));
        
        res.json(formattedMessages);
    });
});

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
        success: true,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype
    });
});

// Send message (updated to handle different message types)
app.post('/api/messages', (req, res) => {
    const { senderId, receiverId, text, messageType, fileUrl, fileName, fileSize, fileType } = req.body;

    if (!senderId || !receiverId) {
        return res.status(400).json({ error: 'Sender and receiver IDs are required' });
    }

    // For text messages, text is required; for file messages, fileUrl is required
    if (messageType === 'text' && !text) {
        return res.status(400).json({ error: 'Text is required for text messages' });
    }

    if (messageType !== 'text' && !fileUrl) {
        return res.status(400).json({ error: 'File URL is required for file messages' });
    }

    db.run(
        'INSERT INTO messages (sender_id, receiver_id, text, message_type, file_url, file_name, file_size, file_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [senderId, receiverId, text, messageType, fileUrl, fileName, fileSize, fileType],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to send message: ' + err.message });
            }

            // Create notification for receiver
            const notificationMessage = messageType === 'text' ? 'You have a new message' : `You have a new ${messageType}`;
            db.run(
                'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
                [receiverId, 'message', 'New Message', notificationMessage],
                (err) => {
                    if (err) {
                        console.error('Failed to create notification:', err);
                    }
                }
            );

            res.json({ success: true, messageId: this.lastID });
        }
    );
});

// Mark message as delivered
app.post('/api/messages/delivered', (req, res) => {
    const { messageId, userId } = req.body;

    db.run(
        'UPDATE messages SET delivered_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver_id = ? AND delivered_at IS NULL',
        [messageId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to mark message as delivered' });
            }
            res.json({ success: true });
        }
    );
});

// Mark message as read
app.post('/api/messages/read', (req, res) => {
    const { messageId, userId } = req.body;

    db.run(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver_id = ? AND read_at IS NULL',
        [messageId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to mark message as read' });
            }
            res.json({ success: true });
        }
    );
});

// Avatar upload route
app.post('/api/avatar-upload', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No avatar uploaded' });
    }

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed for avatars' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    res.json({
        success: true,
        avatarUrl: avatarUrl
    });
});

// Update user avatar
app.post('/api/update-avatar', (req, res) => {
    const { userId, avatarUrl } = req.body;

    if (!userId || !avatarUrl) {
        return res.status(400).json({ error: 'User ID and avatar URL are required' });
    }

    db.run(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatarUrl, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update avatar' });
            }
            res.json({ success: true, avatarUrl: avatarUrl });
        }
    );
});

// Unfriend endpoint
app.post('/api/unfriend', (req, res) => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ error: 'User ID and friend ID are required' });
    }

    // Remove friendship from both directions
    db.run(
        'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
        [userId, friendId, friendId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to unfriend' });
            }
            res.json({ success: true, message: 'Unfriended successfully' });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`ChatApp server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
}); 