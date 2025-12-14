// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Socket.io beállítása (CORS engedélyezése a React kliensnek)
const io = new Server(server, {
  cors: {
    origin: "*", // Élesben ide a kliens URL-je kerülne
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Ha valaki rajzol (drawing esemény), küldd tovább mindenkinek, KIVÉVE a küldőnek
  socket.on("draw_line", (data) => {
    socket.broadcast.emit("draw_line", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING ON PORT 3001");
});