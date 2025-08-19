const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  wpm: { type: Number, default: 0 },
  socketId: { type: String, required: true }, // keep track of socket
});

const roomSchema = new mongoose.Schema({
    // id: { type: String, required: true, unique: true },
  roomId: { type: String, required: true },
  players: [playerSchema],
  status: { type: String, default: "waiting" }, // waiting, countdown, playing, finished
},  { versionKey: false });

module.exports = mongoose.model("Room", roomSchema);
