const WebSocket = require("ws");
const redis = require("redis");
let redisClient;

let clients = []; //Websocketverbindungen
let messageHistory = [];



let testarray = ["test1", "test2", "test3"];

//let clients2 ={};

let benutzer = []; // Chatnamen der Nutzer

// Intiiate the websocket server


const initializeWebsocketServer = async (server) => {

  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || "6379",
    },
  });

  await redisClient.connect();

// Redis al sMessageBroker verwenden um Nachrichten auf die anderen Backend zu synchronisieren
  // This is the subscriber part
  const subscriber = redisClient.duplicate();
  await subscriber.connect();
  // This is the publisher part
  publisher = redisClient.duplicate();
  await publisher.connect();

  await subscriber.subscribe("besynchronisation", beSynchronisation);

  // Nachrichtenverlauf aus Redis abrufen
  nachrichtenverlaufAusRedisLokalSpeichern();
  

  benutzerlisteInRedisSpeichern();
  benutzerAusRedisLokalSpeichern();
  await pause(100);



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

  // Senden des Nachrichtenverlaufs an den neuen Client
  sendeNachrichtenverlaufZuClient(ws);

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
      //nicht genutzt
      break;
    case "neuerBenutzer":

      benutzerAusRedisLokalSpeichern();
      await pause(100);

      //neuen Benutzer der Benutzerliste benutzer[] hinzufügen
      benutzer.push(messageObject.benutzer);

      /* Den Benutzernamen als Attribut der Websocketverbindung hinzufügen. 
      Damit der Benutzername identifiziert werden kann wenn die Websocketverbindung geschlossen wird */
      ws.benutzername = messageObject.benutzer;
      //console.log(ws);
      //console.log(benutzer);

      // altualisierte Liste der Benutzer an alle Clients schicken
      sendeBenutzerlisteZuClients();

      benutzerlisteInRedisSpeichern();



      break;
    case "benutzernameWechsel":

       benutzerAusRedisLokalSpeichern();
       await pause(100);

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
      sendeBenutzerlisteZuClients();
      benutzerlisteInRedisSpeichern();

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

      //Nachrichten von Redis im lokalen messageHistory[] speichern damit man auf dem aktuellsten Stand ist
      nachrichtenverlaufAusRedisLokalSpeichern();

      //Die Neue Nachricht im Nachrichtenverlauf messageHistory[] anfügen

      messageHistory.push(messageObject);
      //Die aktualisierte messageHistory im Redis speichern
      setMessageHistory(JSON.stringify(messageHistory))

      console.log("Nachrichtenverlauf auf Redis aktualisiert", JSON.stringify(messageHistory));


      // Nachricht mit einer forEach Schlaufe an alle Clients senden die im Array clients[] stehen
      clients.forEach((client) => {

        client.send(JSON.stringify(messageObject));
        //client.send(JSON.stringify(messageHistory));


      });

      publisher.publish("besynchronisation", JSON.stringify(messageObject));


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
// TODO: Remove related user from connected users and propagate new list

const onClose = async (ws) => {
  console.log("Websocket connection closed");
  console.log(ws.benutzername);

  benutzerAusRedisLokalSpeichern();
  await pause(100);

  // Index des zu entfernenden Benutzers ermitteln
  let zuEntfernenderIndex = benutzer.indexOf(ws.benutzername);
  //console.log(zuEntfernenderIndex);

  // Benutzer aus dem Array entfernen
  if (zuEntfernenderIndex !== -1) {
    benutzer.splice(zuEntfernenderIndex, 1);
  }


  // altualisierte Liste der Benutzer an alle Clients schicken
  sendeBenutzerlisteZuClients()

  benutzerlisteInRedisSpeichern();


};

const getMessageHistory = async () => {
  return await redisClient.get("messageHistory");
};

const setMessageHistory = async (messageHistory) => {
  await redisClient.set("messageHistory", messageHistory);
};

module.exports = { initializeWebsocketServer };

function sendeBenutzerlisteZuClients() {

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

function sendeNachrichtenverlaufZuClient(client) {
  // Senden des Nachrichtenverlaufs als JSON an den Client

  let datenzumSenden = {
    type: "initialeDaten",
    users: benutzer,
    messageHistory: messageHistory,
  };

  // Senden des JSON-Objekts an den Client
  client.send(JSON.stringify(datenzumSenden));

  //client.send(JSON.stringify(messageHistory));
}

//Nachrichten aus Redis auslesen und lokal in messageHistory[] speichern
function nachrichtenverlaufAusRedisLokalSpeichern() {
  getMessageHistory()
    .then((messageHistory) => {
      if (messageHistory) {
        // Nachrichtenverlauf wurde erfolgreich aus Redis abgerufen
        let parsedMessageHistory = JSON.parse(messageHistory);
        console.log("Nachrichtenverlauf aus Redis abgerufen:", parsedMessageHistory);
        
        // Nachrichtenverlauf aus dem Redis im "lokalen" messageHistory[] speichern
        messageHistory = parsedMessageHistory;
      } else {
        // Nachrichtenverlauf existiert nicht in Redis oder ist leer
        console.log("Kein Nachrichtenverlauf in Redis gefunden.");
      }
    })
    .catch((error) => {
      console.error("Fehler beim Abrufen des Nachrichtenverlaufs aus Redis:", error);
    });
}

/*
async function benutzerAusRedisLokalSpeichern(){
  
      const benutzerInRedis = await redisClient.get("benutzer");
      if (benutzerInRedis) {
        
        let parsedBenuterAusRedis = JSON.parse(benutzerInRedis);
        console.log("Benutzerliste aus Redis abgerufen:", parsedBenuterAusRedis);
        
        benutzer=parsedBenuterAusRedis;
      } else {
        
        console.log("Keine Benutzer in Redis gefunden.");
      }
  }
      
  async function benutzerlisteInRedisSpeichern(){
    try{
    
      await redisClient.set("benutzer", JSON.stringify(benutzer));
      console.log("Benutzerliste in Redis gespeichert");
    }catch (error) {
      console.error("Fehler beim Speichern der Benutzerliste in Redis:", error);
    }
  }
*/


function benutzerAusRedisLokalSpeichern() {
  holeBenutzerliste()
    .then((benutzerlisteRedis) => {
      if (benutzerlisteRedis) {
        // Benutzerliste wurde erfolgreich aus Redis abgerufen
        pause(100);
        let parsedBenutzerliste = JSON.parse(benutzerlisteRedis);
        console.log("Benutzer aus Redis abgerufen:", parsedBenutzerliste);
        // Benutzerliste aus dem Redis im "lokalen" benutzer[] speichern
         pause(2000);
        console.log("Benutzer aus benutzer[] vor aktualisierung:", benutzer);
        benutzer = parsedBenutzerliste; 
        pause(100);
        console.log("Benutzer aus benutzer[] nach aktualisierung:", benutzer);
      } else {
        // Benutzerliste existiert nicht in Redis oder ist leer
        console.log("Keine Benutzerliste in Redis gefunden.");
      }
    })
    .catch((error) => {
      console.error("Fehler beim Abrufen der Benutzerliste aus Redis:", error);
    });
}

function benutzerlisteInRedisSpeichern() {
  speichereBenutzerliste(JSON.stringify(benutzer));
}

const holeBenutzerliste = async () => {
  return await redisClient.get("benutzer");
};

const speichereBenutzerliste = async (benutzerliste) => {
  await redisClient.set("benutzer", benutzerliste);
};


 function pause(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// If a new message from the redis channel is received, the onRedisMessage function is called
const beSynchronisation = async (message) => {
  const messageObject = JSON.parse(message);
  console.log("Nachricht vom Message Broker empfangen: " + messageObject.type);
  switch (messageObject.type) {
    case "message":
      clients.forEach((client) => {
        client.send(JSON.stringify(messageObject));
      });
      break;
    case "pushUsers":
      await pushUsers();
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
}; 