exports.addGlobalMetadata = function (model) {
  model._appLogoPath = "public/spagnet.svg";
  model._appFaviconPath = "public/spagnet.ico";
  model._appLogoUrl = "https://docs.silksong-modding.org";
  model._lang = "en";
  return model;
};

// docfx only knows how to build source links for GitHub, Azure DevOps and Bitbucket remotes, so
// "Improve this Doc" and "View Source" links come out empty for repositories on the forge. Fill
// them in with Forgejo URLs wherever docfx left them blank.
const FORGE_REPO = /^https:\/\/git\.silksong-modding\.org\/[^/]+\/[^/]+$/i;

function normalizeRepoUrl(repo) {
  return repo
    .replace(/^ssh:\/\/[^@/]+@([^/:]+)(:\d+)?\//, "https://$1/") // ssh://git@host:22/owner/repo
    .replace(/^[^@:/]+@([^:/]+):/, "https://$1/") // git@host:owner/repo
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
}

function encodePath(value) {
  return value.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
}

function forgeUrl(remote, startLine) {
  if (!remote || !remote.repo || !remote.branch || !remote.path) return "";
  const repo = normalizeRepoUrl(remote.repo);
  if (!FORGE_REPO.test(repo)) return "";
  const refType = /^[0-9a-f]{40}$/i.test(remote.branch) ? "commit" : "branch";
  let url = `${repo}/src/${refType}/${encodePath(remote.branch)}/${encodePath(remote.path)}`;
  if (startLine > 0) url += `#L${startLine}`;
  return url;
}

function fillItem(item, includeSource) {
  if (!item) return;
  if (!item.docurl && item.documentation) {
    item.docurl =
      forgeUrl(item.documentation.remote, item.documentation.startLine + 1) || item.docurl;
  }
  if (includeSource && !item.sourceurl && item.source && !item.source.href) {
    item.sourceurl = forgeUrl(item.source.remote, item.source.startLine + 1) || item.sourceurl;
  }
}

// Conceptual pages: docfx only sets `docurl`.
exports.addConceptualGitLinks = function (model) {
  fillItem(model, false);
  return model;
};

// API pages: docfx sets `docurl` and `sourceurl` on the page and on each member.
exports.addApiGitLinks = function (model) {
  fillItem(model, true);
  (model.children || []).forEach((child) => fillItem(child, true));
  return model;
};
