const __ = require("../helper/globals");

const enums = {
  PLATFORM: require("./platform.enum"),
  ROLE: require("./roles.enum")
};

module.exports = __.deepFreeze(enums);
