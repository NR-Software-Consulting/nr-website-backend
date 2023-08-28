const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");

const sendPushNotification = (message) => {
  console.log("Message", message);
  console.log("in send notification function");
  return admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Push notification sent successfully:", response);
    })
    .catch((error) => {
      console.error("Error sending push notification:", error);
    });
};

// In your Strapi backend code

const sendNotification = (topic, message) => {
  // const admin = require("firebase-admin");
  const topicName = topic; // Replace with your topic name

  const notification = {
    title: "Notification Title",
    body: message,
  };

  const messagePayload = {
    notification,
    topic: topicName,
  };

  admin
    .messaging()
    .send(messagePayload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
};

// Usage
// const topic = "news"; // Replace with your topic
// const message = "Hello, this is a push notification!";
// sendPushNotification(topic, message);

// const sendNotification = (data, notification) => {
//   getMessaging()
//     .sendToTopic("news", {
//       // data: data,
//       notification: notification,
//     })
//     .then((response) => {
//       console.log("response", response);
//     })
//     .catch((error) => {
//       console.log("error", error);
//     });
// };

module.exports = { sendNotification, sendPushNotification };
