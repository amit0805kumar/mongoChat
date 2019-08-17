var express = require('express');
var app = express();
var http = require('http').Server(app);
const io = require('socket.io').listen(http);


const path = require('path');


const mongo = require('mongodb').MongoClient;


app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname + '/index.html'));
});



// Connect to mongo
mongo.connect('mongodb+srv://amit:amit@devconnector-dxwk4.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err, client) {
    if (err) {
        throw err;
    }
    var db = client.db('mongochat');

    console.log('MongoDB connected...');

    // Connect to Socket.io
    io.on('connection', function (socket) {
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function (s) {
            io.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
            if (err) {
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function (data) {
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if (name == '' || message == '') {
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insertOne({ name: name, message: message }, function () {
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function (data) {
            // Remove all chats from collection
            chat.deleteMany({}, function () {
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});


