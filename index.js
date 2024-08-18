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
            ws.personName = json.data;
            wss.clients.forEach(function (client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "offline",
                        data: ws.personName,
                    }));
                }
            });
        console.log("A client disconnected");
    });
});
 
server.listen(443, function () {

    console.log('HTTPS Server is listening on port 443');
});

// Optionally, serve HTTP on port 80 for basic HTTP requests
https.createServer(function (req, res) {
    res.write('A 3434 in Cloud'); //write a response to the client
    res.end(); //end the response
}).listen(80); //the server object listens on port 80
