const ModbusRTU = require("modbus-serial");
const express = require("express");

const app = express();
const client = new ModbusRTU();
const PLC_IP = "192.168.1.100";  // Replace with your PLC's IP address
const MODBUS_PORT = 502;

// Connect to Modbus TCP server (PLC)
client.connectTCP(PLC_IP, { port: MODBUS_PORT })
    .then(() => {
        console.log("Connected to PLC");
        client.setID(1); // Set Modbus ID
    })
    .catch(err => {
        console.error("Connection Error: ", err);
    });

// Function to read data from PLC
app.get("/read", async (req, res) => {
    try {
        let data = await client.readHoldingRegisters(0, 10); // Read 10 registers starting at address 0
        res.json(data.data);
    } catch (err) {
        console.error("Read Error: ", err);
        res.status(500).send("Error reading from PLC");
    }
});

// Function to write data to PLC
app.post("/write", express.json(), async (req, res) => {
    try {
        const { address, value } = req.body;
        await client.writeRegister(address, value); // Write value to a specific register
        res.send("Write successful");
    } catch (err) {
        console.error("Write Error: ", err);
        res.status(500).send("Error writing to PLC");
    }
});

// Start the Express server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
