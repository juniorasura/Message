# ChatApp - Simple Chat Web Application

A modern, responsive chat web application built with HTML, CSS, and JavaScript that mimics WhatsApp's interface and functionality.

## Features

### 🔐 Account System
- **User Registration**: Create new accounts with username and password
- **User Login**: Secure authentication using username
- **Session Management**: Automatic login persistence using IndexedDB
- **Logout**: Secure logout functionality

### 👥 Friend Management
- **Friend List**: View all your friends in a WhatsApp-like sidebar
- **Add Friends**: Add new friends using their username
- **Search Friends**: Real-time search through your friends list
- **Friend Status**: See your friends' current status/availability

### 💬 Chat Features
- **Real-time Messaging**: Send and receive messages instantly
- **Message History**: All conversations are saved locally
- **Auto-replies**: Simulated responses from friends for demo purposes
- **Message Timestamps**: See when messages were sent
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 👤 Profile Management
- **Edit Profile**: Update your display name, username, and status
- **Profile Picture**: Upload and change your avatar
- **Status Updates**: Set custom status messages
- **Profile Modal**: Easy-to-use profile editing interface

### 🎨 User Interface
- **Modern Design**: Clean, WhatsApp-inspired interface
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Professional transitions and effects
- **Notification System**: Toast notifications for user feedback
- **Color Scheme**: Beautiful gradient backgrounds and modern colors

## How to Use

### Getting Started

1. **Open the Application**
   - Simply open `index.html` in your web browser
   - No server setup required - it's a pure client-side application

2. **Create an Account**
   - Click "Register" on the login screen
   - Fill in your username, email, and password
   - Click "Register" to create your account

3. **Login**
   - Use your username and password to log in
   - The app will remember your login session

### Using the Chat Features

1. **Adding Friends**
   - Click the "Add Friend" button in the sidebar
   - Enter your friend's username
   - Click "Send Friend Request"

2. **Starting a Chat**
   - Click on any friend from the friends list
   - The chat interface will open on the right side
   - Type your message and press Enter or click the send button

3. **Managing Your Profile**
   - Click the profile icon (user icon) in the top-left corner
   - Edit your display name, username, status, and profile picture
   - Click "Save Changes" to update your profile

4. **Searching Friends**
   - Use the search bar in the sidebar to find specific friends
   - Search by name or status

### Sample Data

The app comes with pre-loaded sample users for testing:
- **John Doe** (username: `johndoe`) - Password: `123456`
- **Jane Smith** (username: `janesmith`) - Password: `123456`  
- **Mike Johnson** (username: `mikejohnson`) - Password: `123456`

You can log in with any of these accounts using their username.

## Technical Details

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Object-oriented programming with classes
- **IndexedDB**: Client-side database for reliable data persistence
- **Font Awesome**: Icons and UI elements

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

### Data Storage
- All data is stored locally in the browser's IndexedDB
- No external database or server required
- Data persists between browser sessions
- Private and secure - data never leaves your device

### Validation Rules
- **Username**: 3-20 characters, letters, numbers, and underscores only
- **Email**: Valid email format required
- **Password**: Minimum 6 characters

## File Structure

```
ChatApp/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── database.js         # IndexedDB database management
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Customization

### Adding New Features
The modular JavaScript code makes it easy to add new features:
- Add new user properties in the user object
- Extend the message system with new message types
- Add new UI components by following the existing patterns

### Styling Changes
- Modify `styles.css` to change colors, fonts, and layout
- The CSS uses CSS custom properties for easy theming
- Responsive breakpoints are clearly defined

### Localization
- Text strings are easily replaceable in the JavaScript code
- Add support for multiple languages by creating language objects

## Security Notes

- This is a demo application for educational purposes
- Passwords are stored in plain text (not recommended for production)
- All data is stored locally in the browser
- No real-time communication - messages are simulated

## Future Enhancements

Potential features that could be added:
- Real-time messaging with WebSockets
- File sharing and media messages
- Group chat functionality
- Message encryption
- Push notifications
- Voice and video calling
- Message reactions and emojis
- Dark mode theme
- Two-factor authentication
- Profile picture uploads

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please check the code comments or create an issue in the repository.

---

**Enjoy chatting with your friends! 🚀** 