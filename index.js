const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const express = require('express');

let privateKey, certificate;
try {
    privateKey = fs.readFileSync('private_key.pem');
    certificate = fs.readFileSync('certificate.pem');
} catch (error) {
    console.error('Error loading SSL/TLS certificate and key:', error);
    process.exit(1);
}

// Create an Express application
const app = express();

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Optionally, you can handle HTTP GET requests
app.get('/', (req, res) => {
    res.send('Hello, HTTPS with WebSocket!');
});

// Create an HTTPS server with Express
const server = https.createServer({
    key: privateKey,
    cert: certificate,
}, app);

// Create a WebSocket server on top of the HTTPS server
const wss = new WebSocket.Server({ server });

const PING_INTERVAL = 30000; // 30 seconds
const PONG_TIMEOUT = 10000; // 10 seconds

function setupHeartbeat(ws) {
    let timeout;

    function ping() {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
            timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.terminate();
                }
            }, PONG_TIMEOUT);
        }
    }

    ws.on('pong', () => {
        clearTimeout(timeout);
    });

    ws.on('close', () => {
        clearTimeout(timeout);
        clearInterval(intervalId);
        notifyClientsOffline(ws.personName);
    });

    ping();
    const intervalId = setInterval(ping, PING_INTERVAL);
}

function notifyClientsOffline(personName) {
    console.log('Client offline:', personName);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "offline",
                data: personName,
            }));
        }
    });
}

wss.on('connection', function (ws) {
    setupHeartbeat(ws);

    ws.on('message', function (event) {
        try {
            var json = JSON.parse(event);
            console.log('Received message:', json);

            switch (json.type) {
                case 'name':
                    ws.personName = json.data;
                    wss.clients.forEach(function (client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "name",
                                data: json.data,
                            }));
                        }
                    });
                    break;
                case 'message':
                    wss.clients.forEach(function (client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "message",
                                name: ws.personName,
                                data: json.data
                            }));
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket connection error:', error);
    });

    console.log('A new client connected');
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

server.listen(443, function () {
    console.log('HTTPS Server is listening on port 443');
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        wss.clients.forEach(client => client.terminate());
        process.exit(0);
    });
});
