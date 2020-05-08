const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    const { user } = addUser({ id: socket.id, name, room });

    socket.emit("message", {
      user: "super-admin",
      text: `Welcome to the room :)`,
    });

    socket.broadcast
      .to(user.room)
      .emit("message", { user: "super-admin", text: `${user.name} has join.` });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    removeUser(socket.id);

    socket.broadcast.to(user.room).emit("message", {
      user: "super-admin",
      text: `${user.name} has left the room.`,
    });

    socket.broadcast.to(user.room).emit("roomData", {
      users: getUsersInRoom(user.room),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
