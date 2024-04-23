import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js'

let socket = io({
    auth: {
        serverOffset: 0
    }
});

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

socket.on("chat message", (message, serverOffset) => {
  const msg = `<li class="list-group-item text-white">${message}</li>`;
  messages.insertAdjacentHTML("beforeend", msg);
  socket.auth.serverOffset = serverOffset;
  messages.scrollTop = messages.scrollHeight;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});