"use strict";

const _ = require("lodash");
const jwt = require("jsonwebtoken");
const utils = require("@strapi/utils");
const bcrypt = require("bcrypt");
const { yup, validateYupSchema } = require("@strapi/utils");
const { ApolloError } = require("apollo-server-express");
const axios = require("axios");


const {
  googleLogin,
  appleLogin,
  verifyAppleToken,
  verifyGoogle,
} = require("./utils/socialSignin");

const { sendEmail } = require("../src/utils/sendEmail");

const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeUser = (user, context) => {
  const { auth } = context.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

// JWT issuer
const issue = (payload, jwtOptions = {}) => {
  _.defaults(jwtOptions, strapi.config.get("plugin.users-permissions.jwt"));
  return jwt.sign(
    _.clone(payload.toJSON ? payload.toJSON() : payload),
    strapi.config.get("plugin.users-permissions.jwtSecret"),
    jwtOptions
  );
};

const verifyJwt = (token) => {
  return jwt.verify(
    token,
    strapi.config.get("plugin.users-permissions.jwtSecret")
  );
};
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const registerBodySchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  type: yup.string().required(),

  confirmPassword: yup
    .string()
    .oneOf([
      yup.ref("password"),
      "password and confirm password should be match",
    ])
    .required(),
  // phoneNumber: yup.string().required(),
  // firstName: yup.string().required(),
  // lastName: yup.string().required(),
  //   opt: Math.floor(100000 + Math.random() * 900000),
  //   await sendOtpToUser(identifier, otp);
});

const validateRegisterBody = validateYupSchema(registerBodySchema);

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // blurhash.generatePlaceholder(strapi);
    const extensionService = strapi.service("plugin::graphql.extension");
    extensionService.use(({ strapi }) => ({
      typeDefs: `
        extend input UsersPermissionsRegisterInput {
          email: String!
          password: String!
          confirmPassword:String
          companyName: String
          taxNumber: Int
          CRNumber: Int
          phoneNumber: String
          country_code:String
          calling_code:String
          googleToken:String
          appleToken:String
          username: String
           type: String
           last_name:String
           first_name:String

        },
       type UsersPermissionsMe {
        id:ID
        email:String
        type:String
       }
        type Mutation {
          verifyOtp(input: VerifyOtpInput!): VerifyOtpPayload
        },
        input VerifyOtpInput {
          email: String!
          otp: Int!
        },
        type VerifyOtpPayload {
          status: Boolean!
          message: String!
          user: User
        },
        type User {
          id: String!
          email: String!
          username: String
          company_profile: Company_Profile
          user_profile: User_Profile
          type:String
        },
        type Mutation {
          resendOtp(input: ResendOtpInput!): ResendOtpPayload
        },
        input ResendOtpInput {
          email: String!
        },
        type ResendOtpPayload {
          status: Boolean!
          message: String!
          user: User
        },
        type UsersPermissionsPasswordPayload {
          status: Boolean!
          message: String!
        },
        type Mutation {
          newPassword(input: NewPasswordInput!): NewPasswordPayload
        },
        input NewPasswordInput {
          email: String!
          newPassword: String!
          confirmPassword: String!
          otp: String!
        },
        type NewPasswordPayload {
          status: Boolean!
          message: String!
          user: User
        },
        extend input CartInput {
          user: ID,
          product: ID,
          quantity: Int
        },
        type Profile_Image {
          id: String
          url: String
        }

        type ImageData {
          id: String
          attributes: ImageAttributes
        }

        type ImageAttributes {
          url: String
        }
        extend input FavouriteInput{
          user: ID,
          product: ID
        },
        type User_Profile {
          id: String!
          last_name:String!
          first_name:String!
          profile_image:Profile_Image
        }

        type Company_Profile {
          id: String!
          companyName:String!
          profile_image:Profile_Image
        }
        type UsersPermissionsLoginPayload {
          status: String,
          jwt: String,
          user_profile: User_Profile
          company_profile: Company_Profile

        }
        type Mutation {
          googleLogin(input: GoogleloginInput!): GoogleloginPayload
        },
        input GoogleloginInput {
          id_token: String!
        }
        type GoogleloginPayload {
          status: String!
          message: String!
          email: String!
          user: User,
          jwt: String
        }
        type Mutation {
          appleLogin(input: AppleloginInput!): AppleloginPayload
        },
        input AppleloginInput {
          id_token: String!
        }
        type AppleloginPayload {
          status: String!
          message: String!
email: String
          user: User,
          jwt: String
        },
         input disableAccountInput {
          id:ID
        }
      type  disableAccount {
          id:String!
          status:String!
          isDeleted:Boolean!
        }

        type Mutation {
          disableAccount(input: disableAccountInput!): disableAccount
        },
        type Mutation {
          saveFcmToken(input: FcmTokenInput!): FcmTokenPayload
        },
        input FcmTokenInput {
          token: String
          user: ID,
        },
        type FcmTokenPayload {
          user: User
          token: String
        },



        `,
      // mutation: `createCart(input CartInput)`,
      // mutation: `register(input UsersPermissionsRegisterInput!): UsersPermissionsLoginPayload `,
      // mutation: `verifyOtp(input VerifyOtpInput!): VerifyOtpPayload`,
      // mutation: `forgotPassword(email: String!): UsersPermissionsPasswordPayload`,

      resolvers: {
        Mutation: {
          saveFcmToken: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log("Args Data:", args);

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { id: args.input.user } });
              if (!user) {
                throw new ApolloError("User not found", "NOT_FOUND", {
                  statusCode: 404,
                  message: "User not found",
                }); // Throw an error if the user is not found
              }
              console.log("User Data", user);

              const updatedUser = await strapi
                .query("plugin::users-permissions.user")
                .update({
                  where: { id: user.id },
                  data: { fcmToken: args.input.token },
                  publishedAt: Date.now(),
                });

              console.log("Update result", updatedUser);

              return {
                user: updatedUser,
                token: updatedUser.fcmToken,
              };
            },
          },
          googleLogin: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log("Args Data:", args);
              let response = await googleLogin(args.input);

              return response;
            },
          },
          appleLogin: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log("Args Data:", args);
              let response = await appleLogin(args.input);

              return response;
            },
          },
          createCart: {
            resolve: async (parent, args, context) => {
              const { toEntityResponse } = strapi
                .plugin("graphql")
                .service("format").returnTypes;

              console.log({ parent, args, context });

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { id: args.data.user } });
              if (!user) {
                throw new ApolloError("User not found", "NOT_FOUND", {
                  statusCode: 404,
                  message: "User not found",
                }); // Throw an error if the user is not found
              }

              const product = await strapi
                .query("api::product.product")
                .findOne({ where: { id: args.data.product } });
              if (!product) {
                throw new ApolloError("Product not found", "NOT_FOUND", {
                  statusCode: 404,
                  message: "Product not found",
                }); // Throw an error if the product is not found
              }

              const existingCart = await strapi
                .query("api::cart.cart")
                .findOne({
                  where: {
                    user: user.id,
                    product: product.id,
                  },
                });

              if (existingCart) {
                const quantity = existingCart.quantity + args.data.quantity;
                console.log("Quantity", quantity);

                const updatedCart = await strapi
                  .query("api::cart.cart")
                  .update({
                    where: { id: existingCart.id },
                    data: { quantity },
                    publishedAt: Date.now(),
                  });

                console.log("Update result", updatedCart);
                return toEntityResponse(updatedCart, { args });
              }

              const newCart = await strapi.query("api::cart.cart").create({
                data: {
                  user: user.id,
                  product: product.id,
                  quantity: args.data.quantity,
                  publishedAt: Date.now(),
                },
              });

              return toEntityResponse(newCart, { args });
            },
          },
          createFavourite: {
            resolve: async (parent, args, context) => {
              const { user, product } = args.data;

              // Check if the user exists
              const userExists = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { id: user } });
              if (!userExists) {
                throw new Error("User not found.");
              }

              // Check if the product exists
              const productExists = await strapi
                .query("api::product.product")
                .findOne({ where: { id: product } });
              if (!productExists) {
                throw new Error("Product not found.");
              }

              // Check if the favourite entry already exists
              let favouriteEntry = await strapi
                .query("api::favourite.favourite")
                .findOne({ where: { user, product } });
              if (!favouriteEntry) {
                // Create a new favourite entry
                favouriteEntry = await strapi
                  .query("api::favourite.favourite")
                  .create({
                    data: {
                      user,
                      product,
                      publishedAt: Date.now(),
                    },
                  });
              }

              const { toEntityResponse } = strapi
                .plugin("graphql")
                .service("format").returnTypes;

              return toEntityResponse(favouriteEntry, { args });
            },
          },
          register: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log("Args Data 123", args);

              const pluginStore = await strapi.store({
                type: "plugin",

                name: "users-permissions",
              });

              const settings = await pluginStore.get({
                key: "advanced",
              });
              console.log("Role Role...", args.input.role);

              if (args.input.role == undefined) {
                let role = await strapi
                  .query("plugin::users-permissions.role")
                  .findOne({ where: { type: settings.default_role } });
                args.input.role = role;
                console.log("ABCDEFGH", role);
              } else {
                console.log("we are in else block", args.input.role);
                let role = await strapi
                  .query("plugin::users-permissions.role")
                  .findOne({ where: { type: args.input.role } });
                console.log("find role", role);
                args.input.role = role;
              }
              await validateRegisterBody(args.input);

              // Check if the provided email is valid or not.
              const isEmail = emailRegExp.test(args.input.email);

              if (isEmail) {
                args.input.email = args.input.email.toLowerCase();
              } else {
                throw new ValidationError(
                  "Please provide a valid email address"
                );
              }

              let otp = Math.floor(1000 + Math.random() * 9000);
              args.input.otp = otp;
              console.log("params", otp);

              const user2 = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  where: { email: args.input.email },
                });

              console.log("Already User", user2);
              if (user2 && user2.email == args.input.email) {
                throw new ApplicationError("Email is already taken");
              }

              console.log("Role New Update", args.input.role);
              args.input.password = await bcrypt.hash(args.input.password, 12);
              args.input.provider = args.input.provider || "local";
              args.input.role = args.input.role;
              args.input.type = args.input.type;
              args.input.confirmed = false;
              let user;
              let userProfile;
              let companyProfile;
              if (args.input.type == "user") {
                if (
                  args.input.googleToken &&
                  (await verifyGoogle(args.input.googleToken))
                ) {
                  console.log(
                    "verifyGoogle(args.input.appleToken)",
                    await verifyGoogle(args.input.googleToken)
                  );
                  args.input.confirmed = true;
                  delete args.input.googleToken;
                }
                if (
                  args.input.appleToken &&
                  (await verifyAppleToken(args.input.appleToken))
                ) {
                  console.log(
                    "verifyAppleToken(args.input.appleToken)",
                    await verifyAppleToken(args.input.appleToken)
                  );
                  args.input.confirmed = true;
                  delete args.input.appleToken;
                }
                user = await strapi
                  .query("plugin::users-permissions.user")
                  .create({
                    data: {
                      email: args.input.email,
                      password: args.input.password,
                      type: args.input.type,
                      otp: args.input.otp,
                      role: args.input.role,
                      username: args.input.username,
                      confirmed: args.input.confirmed,
                    },
                    populate: [
                      "role",
                      "user_profile",
                      "company_profile",
                      "company_profile.profile_image",
                      "user_profile.profile_image",
                    ],
                  });
                console.log("User", user);
                userProfile = await strapi
                  .query("api::user-profile.user-profile")
                  .create({
                    data: {
                      username: args.input.username,
                      phoneNumber: args.input.phoneNumber,
                      country_code: args.input.country_code,
                      calling_code: args.input.calling_code,
                      last_name: args.input.last_name,
                      first_name: args.input.first_name,
                      user: user.id,
                      publishedAt: Date.now(),
                    },
                  });
                console.log("User Profile", userProfile);
                // const registrationToken =
                //   "epmXsrl_TRaZmWv4mqYSJR:APA91bH36b96xUXKfIrS0Q2tGUiFqNDcLsQT2rE_EiJiOlJimuhjeLR1dvcYOC3pL0d2VQSv2BXG17tDVp-McLPhyC8pkSQ9qpiGl4AvC-EKl8xoNKFtvJF4QJwZgGVK3OW7EhLOjbKo";
                // const message = {
                //   notification: {
                //     title: "Hello",
                //     body: "This is a push notification from Strapi!",
                //   },
                //   token: registrationToken,
                // };

              } else {
                console.log("type company");
                if (
                  args.input.googleToken &&
                  (await verifyGoogle(args.input.googleToken))
                ) {
                  console.log(
                    "verifyGoogle(args.input.appleToken)",
                    await verifyGoogle(args.input.googleToken)
                  );
                  args.input.confirmed = true;
                  delete args.input.googleToken;
                }
                if (
                  args.input.appleToken &&
                  (await verifyAppleToken(args.input.appleToken))
                ) {
                  console.log(
                    "verifyAppleToken(args.input.appleToken)",
                    await verifyAppleToken(args.input.appleToken)
                  );
                  args.input.confirmed = true;
                  delete args.input.appleToken;
                }
                user = await strapi
                  .query("plugin::users-permissions.user")
                  .create({
                    data: {
                      email: args.input.email,
                      password: args.input.password,
                      type: args.input.type,
                      otp: args.input.otp,
                      role: args.input.role,
                      username: args.input.username,
                      confirmed: args.input.confirmed,
                    },
                    populate: ["role", "company_profile"],
                  });
                console.log("User", user);
                companyProfile = await strapi
                  .query("api::company-profile.company-profile")
                  .create({
                    data: {
                      companyName: args.input.companyName,
                      taxNumber: args.input.taxNumber,
                      CRNumber: args.input.CRNumber,
                      phoneNumber: args.input.phoneNumber,
                      country_code: args.input.country_code,
                      calling_code: args.input.calling_code,
                      user: user.id,
                      publishedAt: Date.now(),
                    },
                  });
                console.log("Company Profile", companyProfile);
              }
              // const user = await strapi
              //   .query("plugin::users-permissions.user")
              //   .create({ data: { ...args.input } });

              console.log("User Data Here......", user);

              const sanitizedUser = await sanitizeUser(user, context);
              console.log("user data", sanitizedUser);
              const jwt = issue(_.pick(user, ["id"]));
              console.log("Token.........", jwt);
              if (sanitizedUser.confirmed == false) {
                console.log("In Email IF");
                console.log("UU", user.email, user.username, otp);
                sendEmail(user.email, "", user.username, otp);
              }
              const returnData = {
                status: true,
                jwt,
                message: args.input.confirmed
                  ? "Register successfully"
                  : "otp is send please check your email",
                confirmed: args.input.confirmed,
                user: sanitizedUser,
                user_profile: userProfile,
                company_profile: companyProfile,
              };
              // const returnData = {
              //   jwt,
              //   user: user,
              // };

              return returnData;
            },
          },
          login: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log("Args Data:", args);

              const isEmail = emailRegExp.test(args?.input?.identifier);
              if (isEmail) {
                args.input.email = args?.input?.identifier.toLowerCase();
              } else {
                args.input.username = args?.input?.identifier;
              }

              const userWithEmail = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  select: [
                    "id",
                    "email",
                    "otp",
                    "isDeleted",
                    "password",
                    "confirmed",
                  ],
                  where: { email: args?.input?.identifier },
                });

              if (!userWithEmail) {
                throw new ApolloError("Email is incorrect", "EMAIL_INCORRECT", {
                  statusCode: 400,
                  message: "Email is incorrect",
                });
              }
              console.log("userWithEmail", userWithEmail);
              const userWithConfirm = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  where: {
                    id: userWithEmail.id,
                    confirmed: true,
                    isDeleted: false,
                  },
                  populate: [
                    "role",
                    "user_profile",
                    "company_profile",
                    "company_profile.profile_image",
                    "user_profile.profile_image",
                  ],
                });
              console.log("userWithConfirm", userWithConfirm);
              if (!userWithConfirm) {
                throw new ApolloError(
                  "Your account is disabled or not confirmed",
                  "ACCOUNT_DISABLED",
                  {
                    statusCode: 403,
                    message: "Your account is disabled or not confirmed",
                    isConfirm: false,
                  }
                );
              }
              console.log("UUUUUUU", userWithConfirm);
              const result = await bcrypt.compare(
                args?.input?.password,
                userWithConfirm.password
              );

              if (!result) {
                throw new ApolloError(
                  "Incorrect password",
                  "INCORRECT_PASSWORD",
                  {
                    statusCode: 403,
                    message: "Incorrect password",
                  }
                );
              }

              const jwt = issue(_.pick(userWithConfirm, ["id"]));
              console.log("Token:", jwt);

              return {
                message: "Login Successful",
                user: userWithConfirm,
                jwt: jwt,
                user_profile: userWithConfirm.user_profile,
                company_profile: userWithConfirm.company_profile,
              };
            },
          },
          disableAccount: {
            resolve: async (parent, args, context) => {
              console.log({ parent }, { args }, { context });

              console.log(
                "Args Data:",
                JSON.stringify(context.koaContext.request.header.authorization)
              );

              const authorizationHeader =
                context.koaContext.request.header.authorization;
              const token = authorizationHeader.replace("Bearer ", "");
              const decodedToken = verifyJwt(token);
              console.log("decodedToken", decodedToken.id == args.input.id);

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  where: { id: decodedToken.id },
                });

              if (!user) {
                throw new ApolloError("User not found", "NOT_FOUND", {
                  statusCode: 404,
                  message: "User not found",
                });
              }
              console.log(
                "user.id != decodedToken.id",
                parseInt(user.id) != parseInt(decodedToken.id)
              );
              if (parseInt(user.id) != parseInt(decodedToken.id)) {
                throw new ApolloError(
                  "you  don't have a permission to  delete user",
                  "you  don't have a permission to  delete user",
                  {
                    statusCode: 400,
                    message: "you  don't have a permission to  delete user",
                  }
                );
              }

              console.log("User", user);
              const updatedUser = await strapi
                .query("plugin::users-permissions.user")
                .update({
                  where: { id: user.id },
                  data: { isDeleted: true },
                });

              return {
                isDeleted: true,
                status: true,
              };
            },
          },
          verifyOtp: {
            resolve: async (parent, args, context) => {
              const { input } = args;
              const { otp, email } = input;

              if (!email || !otp) {
                throw new ApolloError(
                  "Incorrect params provided",
                  "INCORRECT_PARAMS",
                  {
                    statusCode: 400,
                    message: "Email and OTP are required",
                  }
                );
              }

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  where: { email },
                });

              if (!user) {
                throw new ApolloError("User not found", "NOT_FOUND", {
                  statusCode: 404,
                  message: "User not found",
                });
              }

              console.log("User", user);

              if (parseInt(user.otp) !== otp) {
                throw new ApolloError("Invalid OTP", "INVALID_OTP", {
                  statusCode: 400,
                  message: "Invalid OTP",
                });
              }

              if (!user.confirmed || user.isDeleted) {
                console.log("User not Confirmed or Deleted");
                await strapi.query("plugin::users-permissions.user").update({
                  where: { email: user.email },
                  data: { confirmed: true, isDeleted: false },
                });
              }

              const response = {
                status: true,
                message: "You are Verified",
                user,
              };

              return response;
            },
          },
          resendOtp: {
            resolve: async (parent, args, context) => {
              console.log("In resend Otp API");

              const { email } = args.input;

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { email } });

              if (!user) {
                throw new ApolloError(
                  "This email does not exist",
                  "USER_NOT_FOUND"
                );
              }

              const otp = generateOTP();

              sendEmail(email, "OTP from NR Mobiles", user.username, otp);

              await strapi
                .query("plugin::users-permissions.user")
                .update({ where: { id: user.id }, data: { otp } });

              return {
                status: true,
                message: "OTP sent successfully",
              };
            },
          },
          forgotPassword: {
            resolve: async (parent, args, context) => {
              console.log("forgot passwod api", args);

              const email = args.email;

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { email } });

              if (!user) {
                throw new ApolloError("Email not found", "EMAIL_NOT_FOUND");
              }

              let otp = generateOTP();

              sendEmail(email, "OTP from NR Mobiles", user.username, otp);

              await strapi
                .query("plugin::users-permissions.user")
                .update({ where: { id: user.id }, data: { otp } });

              const message = user.isDeleted
                ? "Account is disabled. OTP has been sent to enable the account."
                : "OTP has been sent to your email.";

              return {
                status: true,
                message,
              };
            },
          },
          newPassword: {
            resolve: async (parent, args, context) => {
              const { email, newPassword, confirmPassword, otp } = args.input;

              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({ where: { email, otp } });

              if (!user) {
                throw new ApolloError(
                  "Please enter correct email or OTP",
                  "INVALID_CREDENTIALS"
                );
              }

              if (newPassword !== confirmPassword) {
                throw new ApolloError(
                  "Passwords do not match",
                  "PASSWORD_MISMATCH"
                );
              }

              const hashedPassword = await bcrypt.hash(newPassword, 12);

              await strapi.query("plugin::users-permissions.user").update({
                where: { id: user.id },
                data: { password: hashedPassword },
              });

              return {
                status: true,
                message: "Password updated successfully",
              };
            },
          },
        },
      },
      resolversConfig: {
        "Mutation.verifyOtp": {
          auth: false,
        },
        "Mutation.resendOtp": {
          auth: false,
        },
        "Mutation.forgotPassword": {
          auth: false,
        },
        "Mutation.newPassword": {
          auth: false,
        },
        "Mutation.disableAccount": {
          auth: false,
        },
        "Mutation.googleLogin": {
          auth: false,
        },
        "Mutation.appleLogin": {
          auth: false,
        },
        "Mutation.googleLoginWeb": {
          auth: false,
        },
      },
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
