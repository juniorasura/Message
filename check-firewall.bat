@echo off
echo ========================================
echo ChatApp Firewall Configuration Check
echo ========================================
echo.

echo Checking if Node.js is allowed through firewall...
netsh advfirewall firewall show rule name="Node.js Server" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js firewall rule already exists
) else (
    echo [WARNING] No Node.js firewall rule found
    echo.
    echo Creating firewall rule for Node.js on port 3000...
    netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000
    if %errorlevel% equ 0 (
        echo [SUCCESS] Firewall rule created successfully
    ) else (
        echo [ERROR] Failed to create firewall rule
    )
)

echo.
echo Checking if port 3000 is listening...
netstat -an | findstr :3000
if %errorlevel% equ 0 (
    echo [SUCCESS] Port 3000 is listening
) else (
    echo [ERROR] Port 3000 is not listening
    echo Make sure to run: npm start
)

echo.
echo ========================================
echo Test URLs:
echo ========================================
echo PC (localhost): http://localhost:3000
echo Phone (same WiFi): http://192.168.18.6:3000
echo Test page: http://192.168.18.6:3000/test-connection.html
echo ========================================
echo.
pause 