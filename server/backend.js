const WebSocket = require("ws");
const redis = require("redis");
let redisClient;

let clients = [];
let messageHistory = [];

let testarray= ["test1", "test2", "test3"];

//let clients2 ={};

let benutzer = []; 

// Intiiate the websocket server


const initializeWebsocketServer = async (server) => {
  
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || "6379",
    },
  });
  
  await redisClient.connect();

  const websocketServer = new WebSocket.Server({ server });
  websocketServer.on("connection", onConnection);
  websocketServer.on("error", console.error);
};








// If a new connection is established, the onConnection function is called
const onConnection = (ws) => {
  console.log("New websocket connection");

  //Den Client dem Array clients hinzufügen
  clients.push(ws);
  ws.on("close", () => onClose(ws));
  ws.on("message", (message) => onClientMessage(ws, message));
  // TODO: Send all connected users and current message history to the new client
  //console.log("ws ist:", ws);
  ws.send(JSON.stringify({ type: "ping", data: "FROM SERVER" }));
};

// If a new message is received, the onClientMessage function is called
const onClientMessage = async (ws, message) => {
  const messageObject = JSON.parse(message);
  console.log("Received message from client: " + messageObject.type);
  switch (messageObject.type) {
    case "pong":
      console.log("Received from client: " + messageObject.data);
    case "user":
      // TODO: Publish all connected users to all connected clients
      break;
    case "neuerBenutzer":
      benutzer.push(messageObject.benutzer);
      ws.benutzername = messageObject.benutzer;
      //console.log(ws);
      //console.log(benutzer);

      // altualisierte Liste der Benutzer an alle Clients schicken
      sendeBenutzerlisteZuClients()



      break;
    case "benutzernameWechsel":
      // Index des zu entfernenden Benutzers ermitteln
      let zuEntfernenderIndex = benutzer.indexOf(messageObject.benutzerAlt);
      //console.log(zuEntfernenderIndex);

      // Benutzer aus dem Array entfernen
      if (zuEntfernenderIndex !== -1) {
        benutzer.splice(zuEntfernenderIndex, 1);
      }

      // neuer Benutzername dem Array hinzufügen
      benutzer.push(messageObject.benutzer);
      //console.log(benutzer); 

      //Attribut Benutzername von ws ändern  
      ws.benutzername = messageObject.benutzer;
      
      // altualisierte Liste der Benutzer an alle Clients schicken
      sendeBenutzerlisteZuClients()

      /*
      //Array in ein JSON Objekt umwandeln
      let benutzerObjekt = benutzerInJSON();

      //Neue Liste der Benutzer an alle Clients schicken
      clients.forEach((client) => {

        client.send(JSON.stringify(benutzerObjekt));

      });

      */


      break;
    case "message":
      // TODO: Publish new message to all connected clients and save in redis
      console.log("Empangene Nachricht", messageObject);

      //Den Nachrichtenverlauf im array messageHistory speichern
      messageHistory.push(messageObject);
      setMessageHistory(JSON.stringify(messageHistory))


      console.log("Empangene Nachricht History", JSON.stringify(messageHistory));


      getMessageHistory()
      .then((messageHistory) => {
        if (messageHistory) {
          // Nachrichtenverlauf wurde erfolgreich aus Redis abgerufen
          const parsedMessageHistory = JSON.parse(messageHistory);
          console.log("Nachrichtenverlauf aus Redis abgerufen:", parsedMessageHistory);
        } else {
          // Nachrichtenverlauf existiert nicht in Redis oder ist leer
          console.log("Kein Nachrichtenverlauf in Redis gefunden.");
        }
      })
      .catch((error) => {
        console.error("Fehler beim Abrufen des Nachrichtenverlaufs aus Redis:", error);
      });




      //let messageHistoryZuruck = getMessageHistory;
      //console.log((messageHistoryZuruck));

      // Nachricht mit einer forEach Schlaufe an alle Clients senden die im Array clients[] stehen
      clients.forEach((client) => {

        client.send(JSON.stringify(messageObject));
        //client.send(JSON.stringify(messageHistory));


      });
 
 
      // ws.send(JSON.stringify(messageObject));  //nur an den einen Client senden von wo die Nachricht kam

      break;
      case "test":
      console.log("Test empfangen: " + messageObject.data);
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
};

// If a connection is closed, the onClose function is called
const onClose = async (ws) => {
  console.log("Websocket connection closed");
  console.log(ws.benutzername);

// Index des zu entfernenden Benutzers ermitteln
let zuEntfernenderIndex = benutzer.indexOf(ws.benutzername);
//console.log(zuEntfernenderIndex);

// Benutzer aus dem Array entfernen
if (zuEntfernenderIndex !== -1) {
  benutzer.splice(zuEntfernenderIndex, 1);
}


// altualisierte Liste der Benutzer an alle Clients schicken
sendeBenutzerlisteZuClients()



  // TODO: Remove related user from connected users and propagate new list
};

const getMessageHistory = async () => {
  return await redisClient.get("messageHistory");
};

const setMessageHistory = async (messageHistory) => {
  await redisClient.set("messageHistory", messageHistory);
};

module.exports = { initializeWebsocketServer };

function sendeBenutzerlisteZuClients(){

   //Array in ein JSON Objekt umwandeln
   let benutzerObjekt = benutzerInJSON();

   //Neue Liste der Benutzer an alle Clients schicken
   clients.forEach((client) => {

     client.send(JSON.stringify(benutzerObjekt));

   });
  
}


function benutzerInJSON() {
  /*let benutzerListeJson = {
    type: "user",
    data: benutzer.map((benutzer, index) => ({
      // id: index + 1, // Eine eindeutige ID für den Client
       benutzername: benutzer, // 
       
     }))
  };
  */

  /*let benutzerListeJson = benutzer.map((benutzer) => ({
    type: "user",
    benutzername: benutzer
  }));
  */


  let benutzerListeJson = {
    type: "user",
    data: benutzer.map((benutzer, index) => ({
      // id: index + 1, // Eine eindeutige ID für den Client
       benutzername: benutzer, // 
       
     }))
  };


  //console.log("in benutzerInJSON() ")
//console.log(benutzerListeJson);
  //return JSON.stringify(benutzerListeJson);
  return benutzerListeJson;
}
