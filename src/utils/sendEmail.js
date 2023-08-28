const sendEmail = async (recipientEmail, subject, name, otp) => {
  try {
    const emailService = strapi.plugins["email"].services.email;

    await emailService.send({
      to: recipientEmail,
      from: "Company Needs gsoftconsulting01@gmail.com",
      subject: "One-Time OTP for Company Needs Email Verification",
      text: `${this.sendEmailTemplate(name, otp)}`,
    });
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Failed to send email:", error?.response);
  }
};

exports.sendEmailTemplate = (name, otp) => `
Dear ${name} ,<br>
This is to inform you that we have initiated the email verification process for your Company Needs account. As an added security measure, we are providing you with a One-Time OTP (One-Time Password) to complete the verification.<br>
<b>Your OTP is: ${otp}</b><br>Please note that this OTP is valid for a single use and will expire shortly. Kindly refrain from sharing this OTP with anyone to ensure the privacy and security of your account.<br>If you did not initiate this verification process or have any concerns regarding your Company Needs account, please contact our support team immediately.<br>
Thank you for your cooperation in maintaining the security of your account.<br>
Best regards,<br><br>Company Needs Support Team`;

module.exports = {
  sendEmail,
};
