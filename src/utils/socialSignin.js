const _ = require("lodash");
const appleSignin = require("apple-signin-auth");
const jwt = require("jsonwebtoken");
const utils = require("@strapi/utils");
const { ApolloError } = require("apollo-server-express");

const axios = require("axios");

const { ValidationError } = utils.errors;

// validation

const { generateJwtToken } = require("./generateJWTToken");
const googleLogin = async (ctx) => {
  const response = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
    params: ctx,
  });

  const userWithEmail = await strapi
    .query("plugin::users-permissions.user")
    .findOne({
      where: { email: response.data.email },
      populate: ["role", "user_profile", "company_profile"],
    });

  if (!userWithEmail) {
    return {
      status: 202,
      message: "User email verified but user not registered",
      email: response.data.email,
    };
  }

  if (
    response.data.email_verified === "true" &&
    response.data.email === userWithEmail.email
  ) {
    console.log(response.data.email, "email from database");

    const jwt = generateJwtToken(_.pick(userWithEmail, ["id", "email"]));
    console.log("userWithEmail", userWithEmail);
    return {
      status: 200,
      message: "Login Successful",
      user: userWithEmail,
      jwt: jwt,
      email: userWithEmail.email,
    };
  }
};

const appleLogin = async (ctx) => {
  try {
    const id_token = ctx.id_token;
    const data = await appleSignin.verifyIdToken(id_token, {
      audience: "com.companyneeds.app", // client id - can also be an array
    });
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: { email: data.email },
      populate: ["role", "user_profile", "company_profile"],
    });
    if (!user) {
      return {
        status: 202,
        message: "User email verified but user not registered",
        email: data.email,
      };
    }
    console.log("User", user);
    if (data.email_verified == "true" && data.email == user.email) {
      const jwt = generateJwtToken(_.pick(user, ["id", "email"]));
      return {
        status: 200,
        message: "Login Successful",
        user: user,
        jwt: jwt,
      };
    }
  } catch (err) {
    return {
      status: 400,
      message: "Error verifying email",
    };
  }
};

const verifyGoogle = async (id_token) => {
  try {
    let data = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: { id_token: id_token },
    });
    return data?.data?.email_verified == "true";
  } catch (error) {
    return false;
  }
};
const verifyAppleToken = async (id_token) => {
  try {
    const data = await appleSignin.verifyIdToken(id_token, {
      audience: "com.companyneeds.app", // client id - can also be an array
    });
    return data?.email_verified == "true";
  } catch (err) {
    return false;
  }
};
module.exports = {
  googleLogin,
  appleLogin,
  verifyAppleToken,
  verifyGoogle,
};
