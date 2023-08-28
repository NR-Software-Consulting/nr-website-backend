// config/firebase.js

const admin = require("firebase-admin");
const serviceAccount = require("../company-needs-firebase-adminsdk-sealg-901b745741.json"); // Update the path

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   // Other configuration options if needed
// });

module.exports = { admin, serviceAccount };
