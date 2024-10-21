/* eslint-disable no-console */
import { Boom } from "@hapi/boom";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import {
  containsAnyWord,
  generateAnswerWithBotion,
  generateAnswerWithGemini,
} from "../utils";

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
        connectToWhatsApp();
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

    const { pushName, message } = messageContent;

    if (!message || !pushName) return;

    const messageText =
      message.conversation?.trim() || message.extendedTextMessage?.text?.trim();

    if (!messageText) return;

    console.log("=".repeat(100));
    console.log(`📱`, remoteJid);
    console.log(`🐵`, pushName);
    console.log(`💬`, messageText);
    console.log("=".repeat(100), "\n");

    if (
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
        text: `Hola! ${pushName}, un gusto saludarte.\n¿en que te puedo ayudar?`,
      });

      return;
    }

    const provider = process.env.CHATBOT_PROVIDER?.toLowerCase() || "botion";

    let answer = "";

    await sock.sendPresenceUpdate("composing");

    if (provider === "botion") {
      answer = (await generateAnswerWithBotion(messageText)).answer;
    }

    if (provider === "gemini") {
      answer = (await generateAnswerWithGemini(messageText)).answer;
    }

    await sock.sendPresenceUpdate("unavailable");

    await sock.sendMessage(remoteJid, {
      text: answer,
    });
  });
}
