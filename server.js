const mongo = require('mongodb').MongoClient;
const clientL = require('socket.io').listen(4000).sockets;

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
    clientL.on('connection', function (socket) {
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function (s) {
            socket.emit('status', s);
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
                    clientL.emit('output', [data]);

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