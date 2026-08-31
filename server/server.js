require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./socket/socket');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

initSocket(io);

// Make io accessible inside controllers via req.app.get('io')
app.set('io', io);

server.listen(PORT, () => {
  console.log(`TeamFlow server running on port ${PORT}`);
});
