const functions = require("firebase-functions");
const admin     = require("firebase-admin");
admin.initializeApp();

// 1. Notification automatique sur nouveau message
exports.onChatMessage = functions.firestore
  .document("spaces/{spaceId}/chat/{msgId}")
  .onCreate(async (snap, context) => {
    const msg     = snap.data();
    const { spaceId } = context.params;
    const spaceSnap = await admin.firestore().doc(`spaces/${spaceId}`).get();
    if (!spaceSnap.exists) return null;
    const memberIds = spaceSnap.data().memberIds || [];
    const tokens = [];
    await Promise.all(
      memberIds
        .filter(uid => uid !== msg.authorId)
        .map(async uid => {
          const userSnap = await admin.firestore().doc(`users/${uid}`).get();
          const token    = userSnap.data()?.fcmToken;
          if (token) tokens.push(token);
        })
    );
    if (tokens.length === 0) return null;
    return admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: `${msg.authorEmoji || "💬"} ${msg.authorName || "Quelqu'un"}`,
        body:  (msg.text || "").substring(0, 120),
      },
      data: { spaceId, type: "chat" },
      webpush: { fcmOptions: { link: "https://isuka-san.github.io/planio-v2/" } }
    });
  });

// 2. Ping special vers un membre cible
exports.onPing = functions.firestore
  .document("spaces/{spaceId}/pings/{pingId}")
  .onCreate(async (snap, context) => {
    const ping    = snap.data();
    const userSnap = await admin.firestore().doc(`users/${ping.targetId}`).get();
    const token    = userSnap.data()?.fcmToken;
    if (!token) return null;
    const msgs = [
      "Viens voir le chat, c'est important ! 👀",
      "Hey, t'es la ? On t'attend ! 🚀",
      "Tu manques a l'equipe ! Reviens vite 💪",
      "Une info urgente t'attend dans le chat 🔥",
      "Yo ! Un message pour toi dans Planio 👋",
    ];
    const body = msgs[Math.floor(Math.random() * msgs.length)];
    return admin.messaging().send({
      token,
      notification: {
        title: `${ping.fromEmoji || "📣"} ${ping.fromName || "Quelqu'un"} te ping !`,
        body,
      },
      data: { spaceId: context.params.spaceId, type: "ping", fromId: ping.fromId },
      webpush: { fcmOptions: { link: "https://isuka-san.github.io/planio-v2/" } }
    });
  });
