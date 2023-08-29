module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d",
      },
    },
    // providers: [
    //   {
    //     name: "google",
    //     provider: "google",
    //     clientId:
    //       "505358320763-j8ggmdqegb00o9n7s1faikd2q6tjdsa9.apps.googleusercontent.com",
    //     clientSecret: "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",
    //     redirectUri: "http://localhost:1337/connect/google/callback", // This should match the authorized redirect URI you set in the Google API project
    //     callback: "/connect/google/callback",
    //     authParams: {
    //       access_type: "online", // or 'offline' if you need to access the user's data even when they are not present
    //     },
    //     enabled: true,
    //   },
    // ],
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
