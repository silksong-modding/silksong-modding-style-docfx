const common = require("./common-pre-transform.js");
exports.preTransform = function (model) {
  return common.addGlobalMetadata(model);
};
