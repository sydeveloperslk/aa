var server = require("ws").Server;
var s = new server({ port: 5001 });

s.on('connection', function (ws) {
    ws.on('message', function (event) {
        var json = JSON.parse(event);
        switch (json.type) {
            case 'name':
                ws.personName = json.data;
                s.clients.forEach(function (client) {
                    if (client != ws) {
                        client.send(JSON.stringify({
                            type: "name",
                            data: ws.personName,
                        }));
                    }
                });
                break;
            case 'message':
                s.clients.forEach(function (client) {
                    if (client != ws) {
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

    console.log('Once more client connection');
    
    ws.on('close', function () {
        console.log("I have lost a client");
    });
});

var http = require('http');
 
//create a server object:
http.createServer(function (req, res) {
  res.write('A Monk in Cloud2 '); //write a response to the client
  res.end(); //end the response
}).listen(80); //the server object listens on port 80