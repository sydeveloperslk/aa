const fs = require('fs');
const https = require('http');
const WebSocket = require('ws');

// Load SSL/TLS certificate and key
const server = https.createServer({
    key: fs.readFileSync('private_key.pem'),
    cert: fs.readFileSync('certificate.pem'),
    // ca: fs.readFileSync('path_to_your_ca_bundle.pem') // Optional: Include this if you have a CA bundle
});

// Create a WebSocket server on top of the HTTPS server
const wss = new WebSocket.Server({ server });

wss.on('connection', function (ws) {
    ws.on('message', function (event) {
        var json = JSON.parse(event);
        switch (json.type) {
            case 'name':
                ws.personName = json.data;
                wss.clients.forEach(function (client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "name",
                            data: ws.personName,
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
    
    ws.on('close', function () {
        console.log("A client disconnected");
    });
});

// Start the HTTPS server, listening on port 5001
server.listen(5001, function () {
    console.log('Server is listening on port 5001');
});

// Optionally, serve HTTP on port 80 for basic HTTP requests
https.createServer(function (req, res) {
    res.write('A Monkw444 in Cloud'); //write a response to the client
    res.end(); //end the response
}).listen(80); //the server object listens on port 80
