const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sets up Socket.IO: authenticates the connecting socket with the same JWT
// used for REST calls, then joins the user to a personal room (for
// notifications) so events can be targeted without broadcasting to everyone.
const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Client asks to join a project room so it receives task/comment updates
    // scoped to the project it's currently viewing.
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};

module.exports = initSocket;
