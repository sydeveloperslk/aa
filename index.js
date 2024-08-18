const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const server = https.createServer({
    key: fs.readFileSync('private_key.pem'),  
    // cert: fs.readFileSync('certificate.pem'),         // Your private key file
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
        // Broadcast message to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(5001, () => {
    console.log('Server is listening on port 5001');
});
var http = require('http');

//create a server object:
http.createServer(function (req, res) {
  res.write('A Cloud eew'); //write a response to the client
  res.end(); //end the response
}).listen(80); //the server object listens on port 80