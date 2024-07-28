/* eslint-disable no-console */
import { Boom } from "@hapi/boom";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

export async function connectToWhatsApp() {
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`Using WhatsApp Web v${version.join(".")}`);
  console.log(`Latest version: ${isLatest ? "yes" : "no"}`);

  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    browser: Browsers.ubuntu("Desktop"),
    syncFullHistory: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("presence.update", (presence) => {
    console.log("Current presence:", { presence });
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error).output.statusCode;

      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete and Scan Again`);
      } else if (reason === DisconnectReason.connectionClosed) {
        connectToWhatsApp();
      } else if (reason === DisconnectReason.connectionLost) {
        connectToWhatsApp();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(
          "Connection Replaced, Another New Session Opened, Please Close Current Session First",
        );
      } else if (reason === DisconnectReason.loggedOut) {
        console.log("Device Logged Out, Please Login Again");
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        connectToWhatsApp();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        connectToWhatsApp();
      } else {
        sock.end(lastDisconnect?.error);
      }
    }

    if (connection === "open") {
      await sock.sendPresenceUpdate("unavailable");
    }
  });

  sock.ev.on("messages.upsert", async (msg) => {
    if (!msg.messages.length) return;

    const messageContent = msg.messages[0];

    if (!messageContent.key) return;

    const { remoteJid, fromMe } = messageContent.key;

    if (fromMe || !remoteJid || remoteJid === "status@broadcast") {
      await sock.sendPresenceUpdate("unavailable");
      return;
    }

    console.log(JSON.stringify(msg, null, 2));

    const { pushName, message } = messageContent;

    if (!message || !pushName) return;

    const messageText =
      message.conversation?.trim() || message.extendedTextMessage?.text?.trim();

    if (!messageText) return;

    if (
      messageText.includes(
        "Hola! 👋, confirmamos nuestra asistencia a su boda y estamos emocionados por compartir este día tan especial con ustedes !Gracias por la invitación!",
      )
    ) {
      const response = `¡Hola! *${pushName}* 😊\n\n¡Muchas gracias por confirmar tu asistencia! Nos alegra mucho saber que nos acompañarán en este día tan especial.\n\nPara asegurarnos de tener todo listo, ¿Nos podrías confirmar tu nombre? Y de acuerdo a tus pases ¿Cuántas personas asistirán?\n\nDetalles del evento:\n\n- Ceremonia: Templo de San Agustín, 5:00 p.m.\n- Recepción: La Huerta, a partir de las 6:00 p.m.\n\n¡Gracias de nuevo por tu confirmación y nos vemos pronto!\n\nAquí está el enlace a la invitación digital: https://boda.edgarbenavides.dev/invitacion\n\nSaludos,\nLizbeth y Edgar.`;
      await sock.sendMessage(
        remoteJid,
        {
          text: response,
        },
        {
          quoted: messageContent,
        },
      );

      return;
    }

    /* if (
      containsAnyWord(messageText, [
        "hello",
        "hi",
        "hola",
        "buenas tardes",
        "buenos dias",
        "buenas noches",
      ])
    ) {
      await sock.sendMessage(remoteJid, {
        text: `Hola! ${pushName}, un gusto saludarte.\nMi nombre es EddBot y como asistente personal de Edgar Benavides. Estoy aqui para responder todas tus preguntas que tengas acerca de su experiencia y trabajo.\nAsi que no dudes en preguntarme.`,
      });

      return;
    }

    const messageIsQuestion = messageText.includes("?");

    if (messageIsQuestion) {
      console.log("Question:", messageText);
      const { answer } = await generateAnswer(messageText);

      await sock.sendMessage(remoteJid, {
        text: answer,
      });
    } */
  });
}
