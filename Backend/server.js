const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const router = require("./router"); // Assuming this is your main API router
const path = require("path");
const http = require("http");


require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Load API routes
app.use("/api", router);

// New: Chat model for saving messages
const Chat = require("./Models/chatModel");

// Create HTTP server & wrap with Socket.io
const server = http.createServer(app); // Create HTTP server from Express app
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" }
});


// Start Server (IMPORTANT: use server.listen instead of app.listen)
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
