const jwt = require("jsonwebtoken");
const _ = require("lodash");
const generateJwtToken = (payload, jwtOptions = {}) => {
  _.defaults(jwtOptions, strapi.config.get("plugin.users-permissions.jwt"));
  return jwt.sign(
    _.clone(payload.toJSON ? payload.toJSON() : payload),
    strapi.config.get("plugin.users-permissions.jwtSecret")
  );
};

module.exports = {
  generateJwtToken,
};
