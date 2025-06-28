https://github.com/juniorasura/Message#// ChatApp Configuration
const ChatAppConfig = {
    // Server Configuration
    // Choose one of the following options:
    
    // Option 1: Local development (localhost)
    LOCAL_SERVER: 'http://localhost:3000/api',
    
    // Option 2: Same network access (replace with your PC's IP)
    NETWORK_SERVER: 'http://192.168.18.6:3000/api',
    
    // Option 3: Railway deployment (replace with your Railway URL)
    RAILWAY_SERVER: 'https://message-production-7f70.up.railway.app/api',
    
    // Option 4: Other deployed backend (replace with your deployed URL)
    DEPLOYED_SERVER: 'https://your-deployed-backend.herokuapp.com/api',
    
    // Current active server - change this to switch between options
    ACTIVE_SERVER: 'RAILWAY_SERVER', // Options: 'LOCAL_SERVER', 'NETWORK_SERVER', 'RAILWAY_SERVER', 'DEPLOYED_SERVER'
    
    // Get the current server URL
    getServerUrl() {
        switch (this.ACTIVE_SERVER) {
            case 'LOCAL_SERVER':
                return this.LOCAL_SERVER;
            case 'NETWORK_SERVER':
                return this.NETWORK_SERVER;
            case 'RAILWAY_SERVER':
                return this.RAILWAY_SERVER;
            case 'DEPLOYED_SERVER':
                return this.DEPLOYED_SERVER;
            default:
                return this.LOCAL_SERVER;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatAppConfig;
} 