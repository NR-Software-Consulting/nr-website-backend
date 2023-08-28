module.exports = [
  "strapi::errors",
  "strapi::security",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        directives: {
          "frame-src": [
            "http://localhost:*",
            "self",
            "sandbox.embed.apollographql.com",
          ],

          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", `storage.googleapis.com`],
          "media-src": ["'self'", "data:", "blob:", `storage.googleapis.com`],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
];
