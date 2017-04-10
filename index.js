var containerFactory = require('./src/container-config');

module.exports = function(username, password, url) {
  var container = containerFactory({
    username: username,
    password: password,
    url: url
  });
  return {
    login: container.get('connection'),
    executeApex: container.get('apex-service'),
    query: container.get('query-service'),
    deleteCommunityUser: container.get('community-user-service').deleteCommunityUser,
    processData: container.get('data-file-service').processData,
    cleanData: container.get('data-file-service').cleanData,
    dataFileService: container.get('data-file-service'),
    communityUserService: container.get('community-user-service'),
    recordService: container.get('record-service'),
    namespaceService: container.get('namespace-service'),
    mappingService: container.get('mapping-service')
  };
};
