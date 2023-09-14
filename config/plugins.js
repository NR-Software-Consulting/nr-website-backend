module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d",
      },
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        service: "gmail",
        auth: {
          user: "ranasaif378@gmail.com",
          pass: "mlnxcoygnvqhqqne",
        },
        settings: {
          defaultFrom: "nr-mobiles nrmobiles23@gmail.com",
          defaultReplyTo: "nrmobiles23@gmail.com",
        },
      },
    },
  },
  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 10,
      amountLimit: 100,
      defaultLimit: 20,
      apolloServer: {
        tracing: false,
      },
    },
  },
  upload: {
    config: {
      provider: "strapi-provider-firebase-storage",
      providerOptions: {
        serviceAccount: require("./serviceAccount.json"),
        bucket: "nr-mobiles.appspot.com",
        sortInStorage: true, // true | false
        debug: false, // true | false
      },
    },
  },
  "apollo-sandbox": {
    // enables the plugin only in development mode
    // if you also want to use it in production, set this to true
    // keep in mind that graphql playground has to be enabled
    enabled: true,
  },

  seo: {
    enabled: true,
  },
});
