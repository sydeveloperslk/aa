// var server = require("ws").Server;
// var s = new server({ port: 5001 });

// s.on('connection', function (ws) {
//     ws.on('message', function (event) {
//         var json = JSON.parse(event);
//         switch (json.type) {
//             case 'name':
//                 ws.personName = json.data;
//                 s.clients.forEach(function (client) {
//                     if (client != ws) {
//                         client.send(JSON.stringify({
//                             type: "name",
//                             data: ws.personName,
//                         }));
//                     }
//                 });
//                 break;
//             case 'message':
//                 s.clients.forEach(function (client) {
//                     if (client != ws) {
//                         client.send(JSON.stringify({
//                             type: "message",
//                             name: ws.personName,
//                             data: json.data
//                         }));
//                     }
//                 });
//                 break;
//         }
//     });

//     console.log('Once more client connection');
    
//     ws.on('close', function () {
//         console.log("I have lost a client");
//     });
// });

// var http = require('http');
 
// //create a server object:
// http.createServer(function (req, res) {
//   res.write('A Monk2 in Cloud'); //write a response to the client
//   res.end(); //end the response
// }).listen(80); //the server object listens on port 80

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const server = https.createServer({
    key: fs.readFileSync('/path/to/your/private.key'),
    cert: fs.readFileSync('/path/to/your/certificate.crt')
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
