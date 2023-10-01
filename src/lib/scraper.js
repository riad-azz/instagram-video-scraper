const handleBlockedResources = (request) => {
  const blockedResources = [
    "image",
    "stylesheet",
    "font",
    "ping",
    "media",
    "manifest",
    "other",
  ];
  if (blockedResources.includes(request.resourceType())) {
    request.abort();
  } else {
    request.continue();
  }
};


module.exports = {
  handleBlockedResources
}