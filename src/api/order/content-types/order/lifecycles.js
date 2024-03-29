module.exports = {
  beforeCreate(event) {
    let { data, where, select, populate } = event.params;

    data.isTableFull = data.numOfPeople === 4;
  },

  afterCreate(event) {
    const { result, params } = event;
    console.log("re", result, params);
    sendEmail(result.id);

    // do something to the result
  },
};

const sendEmail = async (id) => {
  try {
    const emailService = strapi.plugins["email"].services.email;

    await emailService.send({
      to: "nrmobiles23@gmail.com",
      from: "Nr Mobiles nrmobiles23@gmail.com",
      subject: "New Order Received",
      text: `${this.sendEmailTemplate(id)}`,
    });
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Failed to send email:", error?.response);
  }
};

exports.sendEmailTemplate = (id) => `
Received New Order from NR Mobiles Website with Invoice Number ${id}
`;
