const express= require('express');
const http = require('http');
const {Server}= require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({origin:["http://localhost:4200"], credentials:false}));
app.get('/rooms',(req, res) => {
    res.json({rooms: ["room1", "room2", "room3"]});
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:4200"], methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🔌 connected:", socket.id);

  socket.on("ping", () => socket.emit("pong"));

  socket.on("disconnect", (reason) => {
    console.log("❌ disconnected:", socket.id, reason);
  });
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`API running on http://localhost:${PORT}`)
);