var https = require('https');
var fs = require('fs');
var server = require("ws").Server;
var options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
  };
  
var s = new server({ port: 5001 });
 
var httpsServer = https.createServer(options, function (req, res) {
    res.write('A Monk in Cloud2'); //write a response to the client
    res.end(); //end the response
  }).listen(443); //HTTPS typically uses port 443
  var s = new server({ server: httpsServer });

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
