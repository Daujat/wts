import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import logger from "morgan";
import cors from "cors";
import { createClient } from "@libsql/client";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const users = {};
const cont = 0;
const io = new Server(server, {
  connectionStateRecovery: {},
});

const db = createClient({
  url: "libsql://possible-hellboy-sxmydev.turso.io",
  authToken: process.env.DB_AUTH_TOKEN
});

await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT
    )
`);

app.use(cors("*"));

app.use(logger("dev"));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

io.on("connection", async (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", async (msg) => {
    let result;

    try {
      result = await db.execute({
        sql: `INSERT INTO messages (content) VALUES (:content)`,
        args: { content: msg },
      });
    } catch (e) {
      console.error(e);
      return;
    }

    io.emit("chat message", msg, result.lastInsertRowid.toString());
  });

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: `SELECT id, content FROM messages WHERE id > ?`,
        args: [socket.handshake.auth.serverOffset ?? 0],
      });

      results.rows.forEach((row) => {
        socket.emit("chat message", row.content, row.id.toString());
      });
    } catch (e) {
      console.error(e);
      return;
    }
  }
});

server.listen(port, () => {
  console.log(`Server is runing on port ${port}`);
});
