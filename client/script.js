if (location.host.includes("localhost")) {
  // Load livereload script if we are on localhost
  document.write(
    '<script src="http://' +
      (location.host || "localhost").split(":")[0] +
      ':35729/livereload.js?snipver=1"></' +
      "script>"
  );
}
const backendUrl = window.location.origin
  .replace(/^http/, "ws")
  .replace(/^https/, "wss");
const socket = new WebSocket(backendUrl);

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!! DON'T TOUCH ANYTHING ABOVE THIS LINE !!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

socket.addEventListener("open", async (event) => {
  console.log("WebSocket connected!");
  // TODO: create message object to transmit the user to the backend
});

socket.addEventListener("message", (event) => {
  const messageObject = JSON.parse(event.data);
  console.log("Received message from server: " + messageObject.type);
  switch (messageObject.type) {
    case "ping":
      socket.send(JSON.stringify({ type: "pong", data: "FROM CLIENT" }));
    case "user":
      // TODO: Show the current users as DOM elements
      break;
    case "message":
      // TODO: Show new message as DOM element append to chat history
      console.log("Nachricht vom Backend empfangen")
      console.log(messageObject);
      showMessage(messageObject.nachricht);
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});

function showUsers(users) {
  // TODO: Show the current users as DOM elements
}

function showMessage(message) {
  let chatDiv = document.getElementById("chatNachrichten");
  console.log("test stop");
  console.log("vom be empgangene Nachricht:", message, "<br>");
  //chatDiv.innerHTML += "Die sist ein test <br>";
  chatDiv.innerHTML += message + "<br>";
  // TODO: Show new message as DOM element append to chat history
}

socket.addEventListener("close", (event) => {
  console.log("WebSocket closed.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

function changeUsername() {
  // TODO: Implement change username and forward new username to backend
  socket.send(JSON.stringify(message));
}

function sendMessage() {
  // TODO get message from input and send message as object to backend
  console.log("send Message wurde ausgeführt ")
  let nachrichtInhalt = document.getElementById("nachricht").value;
  let nachrichtObjekt = {
    type: "message",
    benutzer: "Testbenutzer1",
    nachricht: nachrichtInhalt


  }
  document.getElementById("nachricht").value = "";
console.log(nachrichtObjekt);

  socket.send(JSON.stringify(nachrichtObjekt));
}
