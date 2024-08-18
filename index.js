const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

// Load SSL/TLS certificate and key
const server = https.createServer({
    key: fs.readFileSync('private_key.pem'),
    cert: fs.readFileSync('certificate.pem'),
});

// Create a WebSocket server on top of the HTTPS server
const wss = new WebSocket.Server({ server });

const PING_INTERVAL = 3000; // 30 seconds
const PONG_TIMEOUT = 1000; // 10 seconds

function setupHeartbeat(ws) {
    let timeout;

    function ping() {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
            timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    // ws.terminate(); // Force close the connection if pong is not received in time
                }
            }, PONG_TIMEOUT);
        }
    }

    ws.on('pong', () => {
        clearTimeout(timeout);
    });

    ws.on('close', () => {
        clearTimeout(timeout);
        clearInterval(intervalId); // Clear interval when connection closes
        notifyClientsOffline(ws.personName);
    });

    ping(); // Initial ping
    const intervalId = setInterval(ping, PING_INTERVAL); // Regular pings
}

function notifyClientsOffline(personName) {
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
        var json = JSON.parse(event);
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
    });

    console.log('A new client connected');
});

server.listen(443, function () {
    console.log('HTTPS Server is listening on port 443');
});

// // Optionally, serve HTTP on port 80 for basic HTTP requests
// https.createServer(function (req, res) {
//     res.write('A 3434 in Cloud'); // Write a response to the client
//     res.end(); // End the response
// }).listen(80); // The server object listens on port 80
