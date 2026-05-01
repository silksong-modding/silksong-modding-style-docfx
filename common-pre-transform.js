exports.addGlobalMetadata = function (model) {
  model._appLogoPath = "public/spagnet.svg";
  model._appFaviconPath = "public/spagnet.ico";
  model._appLogoUrl = "https://docs.silksong-modding.org";
  model._lang = "en"
  return model;
};
