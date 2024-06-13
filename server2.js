const ModbusRTU = require("modbus-serial");
const WebSocket = require("ws");
const express = require("express");

const app = express();
const client = new ModbusRTU();
const PLC_IP = "192.168.1.100";  // Replace with your PLC's IP address
const MODBUS_PORT = 502;
const POLLING_INTERVAL = 1000;  // Polling interval in milliseconds

const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server on port 8080

// Connect to the Modbus TCP server (PLC)
client.connectTCP(PLC_IP, { port: MODBUS_PORT })
    .then(() => {
        console.log("Connected to PLC");
        client.setID(1); // Set Modbus ID
        startPolling();
    })
    .catch(err => {
        console.error("Connection Error: ", err);
    });

// Function to start polling the specific register
function startPolling() {
    setInterval(async () => {
        try {
            const registerAddress = 0; // Address of the register to listen to
            const registerCount = 1;   // Number of registers to read
            let data = await client.readHoldingRegisters(registerAddress, registerCount);
            const registerValue = data.data[0];
            console.log(`Register ${registerAddress} value: `, registerValue);

            // Broadcast register value to all connected WebSocket clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ address: registerAddress, value: registerValue }));
                }
            });
        } catch (err) {
            console.error("Polling Error: ", err);
        }
    }, POLLING_INTERVAL);
}

// Express server (optional for serving static files or additional APIs)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// WebSocket server for real-time communication
wss.on('connection', ws => {
    console.log('New client connected');
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server' }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
