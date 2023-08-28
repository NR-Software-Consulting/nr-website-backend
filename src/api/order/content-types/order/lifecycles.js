const {
  sendPushNotification,
} = require("../../../../utils/send-notifications");

module.exports = {
  async afterUpdate(event) {
    try {
      const { result, params } = event;
      // Only proceed if the status field has been updated
      if (params.data.status) {
        const populatedUser = await strapi.query("api::order.order").findOne({
          where: { id: result.id },
          populate: { user: true },
        });

        if (
          populatedUser &&
          populatedUser.user &&
          populatedUser.user.fcmToken
        ) {
          const registrationToken = populatedUser.user.fcmToken;
          populatedUser.status =
            populatedUser.status.charAt(0).toUpperCase() +
            populatedUser.status.slice(1);
          const message = {
            notification: {
              title: `Order ${populatedUser.status}`,
              body: "This is a push notification from Strapi! Order.....................",
            },
            data: {
              OrderId: populatedUser.id.toString(),
              type: "Order",
            },
            token: registrationToken,
          };

          sendPushNotification(message);

          const entry = await strapi.db
            .query("api::notification.notification")
            .create({
              data: {
                title: message.notification.title,
                message: message.notification.body,
                type: message.data.type,
                orderId: message.data.OrderId,
              },
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
};
