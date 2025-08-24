const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completion: {  type: Number, default: 0 },
  wpm: { type: Number, default: 0 },
  socketId: { type: String, required: true }, // keep track of socket
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true ,  unique: true },
  players: [playerSchema],
  status: { type: String, default: "waiting" }, // waiting, countdown, playing, finished
},  { versionKey: false });

module.exports = playerSchema

module.exports = mongoose.model("Room", roomSchema);
