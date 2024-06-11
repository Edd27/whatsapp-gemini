/* eslint-disable no-console */
import { Boom } from "@hapi/boom";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { containsAnyWord, generateAnswer } from "../utils";

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    browser: Browsers.ubuntu("Desktop"),
    syncFullHistory: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect,
      );

      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  sock.ev.on("messages.upsert", async (msg) => {
    const senderNumber = msg.messages[0]?.key?.remoteJid;
    const senderName = msg.messages[0]?.pushName;
    const message = msg.messages[0]?.message?.conversation;

    if (!message || !senderNumber) return;

    if (
      containsAnyWord(message, [
        "hello",
        "hi",
        "hola",
        "buenas tardes",
        "buenos dias",
        "buenas noches",
      ])
    ) {
      await sock.sendMessage(senderNumber, {
        text: `Hola! ${senderName}, un gusto saludarte.\nMi nombre es EddBot y como asistente personal de Edgar Benavides. Estoy aqui para responder todas tus preguntas que tengas acerca de su experiencia y trabajo.\nAsi que no dudes en preguntarme.`,
      });

      return;
    }

    const messageIsQuestion = message.includes("?");

    if (messageIsQuestion) {
      console.log("Question:", message);
      const { answer } = await generateAnswer(message);

      await sock.sendMessage(senderNumber, {
        text: answer,
      });
    }
  });
}
