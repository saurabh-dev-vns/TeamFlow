const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const Project = require('../models/Project');
const { COOKIE_NAME } = require('../utils/generateToken');

// Sets up Socket.IO: authenticates the connecting socket with the same JWT
// used for REST calls (read from the httpOnly cookie, falling back to an
// explicit auth.token for non-browser clients), then joins the user to a
// personal room (for notifications) so events can be targeted without
// broadcasting to everyone.
const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const parsed = cookie.parse(socket.handshake.headers.cookie);
        token = parsed[COOKIE_NAME];
      }

      if (!token) return next(new Error('Authentication error: no token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found'));
      if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
        return next(new Error('Authentication error: token no longer valid'));
      }

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

    // SECURITY: only let a socket join a project room if the connected user
    // is actually an admin, the project owner, or a project member —
    // otherwise any client could subscribe to any project's live updates by
    // guessing its id.
    socket.on('project:join', async (projectId) => {
      try {
        const project = await Project.findById(projectId).select('owner members');
        if (!project) return;

        const isAllowed =
          socket.user.role === 'admin' ||
          String(project.owner) === userId ||
          project.members.some((m) => String(m) === userId);

        if (isAllowed) socket.join(`project:${projectId}`);
      } catch (err) {
        // invalid id or lookup failure - just don't join
      }
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
