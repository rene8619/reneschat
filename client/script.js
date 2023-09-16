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

let benutzername = BenutzernameGenerieren();
document.getElementById("benutzername").innerHTML = benutzername;


socket.addEventListener("open", async (event) => {
  console.log("WebSocket connected!");
  // TODO: create message object to transmit the user to the backend

  let nachrichtObjekt = {
    type: "neuerBenutzer",
    benutzer: benutzername

  }

  console.log("neuer Benuter: ")
  console.log(nachrichtObjekt);

  socket.send(JSON.stringify(nachrichtObjekt));



});

socket.addEventListener("message", (event) => {
  const messageObject = JSON.parse(event.data);
  console.log("Received message from server: " + messageObject.type);
  switch (messageObject.type) {
    case "ping":
      socket.send(JSON.stringify({ type: "pong", data: "FROM CLIENT" }));
    case "user":
      // TODO: Show the current users as DOM elements

      
      // Das <ul> Element auswählen
      let BenutzerListe = document.getElementById("user-list");

      // Alle vorhandenen <li> Elemente im <ul> Element entfernen
      while (BenutzerListe.firstChild) {
        BenutzerListe.removeChild(BenutzerListe.firstChild);
      }

      // Die Benutzernamen aus dem JSON-Objekt extrahieren und in die Liste einfügen
      benutzerArray.forEach((item) => {
        // Ein <li> Element für jeden Benutzernamen erstellen
        const listItem = document.createElement("li");
        listItem.textContent = item.benutzername;

        // Das <li> Element der <ul> Liste hinzufügen
        BenutzerListe.appendChild(listItem);
      });


      break;
    case "message":
      // TODO: Show new message as DOM element append to chat history
      console.log("Nachricht vom Backend empfangen")
      console.log(messageObject);
      showMessage(messageObject.nachricht, messageObject.benutzer);
      break;

    case "initialeDaten":
      // Initialdaten vom Server empfangen, Nur die messageHistory user sind anderst gelöst
      console.log("Initialdaten vom Server empfangen");
      console.log(messageObject);

      // Nachrichtenverlauf anzeigen
      messageObject.messageHistory.forEach((message) => {
        showMessage(message.nachricht, message.benutzer);
      });

      break;

    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});




function showUsers(users) {
  // TODO: Show the current users as DOM elements
}

function showMessage(message, benutzer) {
  let chatDiv = document.getElementById("chatNachrichten");
  
  chatDiv.innerHTML += "<b>" + benutzer + ": </b>" + message + "<br>";

  // im Chatfenster ganz nach unten scrollen damit man die neusten Nachrichten sieht
  chatDiv.scrollTop = chatDiv.scrollHeight;

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
  let benutzerNeu = document.getElementById("namenswechsel").value;
  let nachrichtObjekt = {
    type: "benutzernameWechsel",
    benutzer: benutzerNeu,
    benutzerAlt: benutzername

  }
  benutzername = benutzerNeu;
  document.getElementById("benutzername").innerHTML = benutzername;

  console.log("neuer Benutzer: ")
  console.log(nachrichtObjekt);

  socket.send(JSON.stringify(nachrichtObjekt));
  
}

// Nachricht mit Enter-Taste absenden
document.getElementById("nachricht").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Verhindert, dass die Eingabezeile einen Zeilenumbruch erzeugt
    sendMessage(); // Ruft die Funktion zum Senden der Nachricht auf
  }
});


function sendMessage() {
  // TODO get message from input and send message as object to backend
  console.log("send Message wurde ausgeführt ")
  let nachrichtInhalt = document.getElementById("nachricht").value;
  let nachrichtObjekt = {
    type: "message",
    benutzer: benutzername,
    nachricht: nachrichtInhalt


  }
  document.getElementById("nachricht").value = "";
  console.log(nachrichtObjekt);

  socket.send(JSON.stringify(nachrichtObjekt));
}

function BenutzernameGenerieren() {
  //Zufallszahl 5 Stellig
  let zufallszahl = Math.floor(10000 + Math.random() * 90000);
  let gastname = "Gast" + zufallszahl;
  return gastname;
}


// funktion um alle Benutzer und der Nachrichtenverlauf im Redis zu leeren.
// wird nicht vom programm genutzt müsste manuell aufgerufen werden
function leereAlles() {
  let loeschObjekt = {
    type: "leeren",
    benutzer: benutzername

  }
  //console.log(loeschObjekt);
  socket.send(JSON.stringify(loeschObjekt));
}