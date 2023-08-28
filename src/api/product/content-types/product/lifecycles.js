// const sendPushNotification = require("../../../../utils/send-notifications");
const { sendNotification } = require("../../../../utils/send-notifications");

const jwt = require("jsonwebtoken");

module.exports = {
  async afterCreate(event) {
    try {
      const { result, params, context } = event;
      console.log("After Create", event);
      console.log("Result", result);
      // Only proceed if the status field has been updated
      const topic = "news";
      const message = "hello from Product";
      // const message = {
      //   notification: {
      //     title: `Product `,
      //     body: "This is a push notification from Strapi! Order.....................",
      //   },
      //   // data: {
      //   //   OrderId: populatedUser.id.toString(),
      //   //   type: "1",
      //   // },
      //   // token: registrationToken,
      // };
      sendNotification(topic, message);
      // if (params.data.status) {
      //   const populatedUser = await strapi.query("api::order.order").findOne({
      //     where: { id: result.id },
      //     populate: { user: true },
      //   });

      //   if (
      //     populatedUser &&
      //     populatedUser.user &&
      //     populatedUser.user.fcmToken
      //   ) {
      //     const registrationToken = populatedUser.user.fcmToken;
      //     const message = {
      //       notification: {
      //         title: `Order ${populatedUser.status}`,
      //         body: "This is a push notification from Strapi! Order.....................",
      //       },
      //       data: {
      //         OrderId: populatedUser.id.toString(),
      //         type: "1",
      //       },
      //       token: registrationToken,
      //     };

      //     sendPushNotification(message);
      //   }
      // }
    } catch (err) {
      console.log(err);
    }
  },
};
