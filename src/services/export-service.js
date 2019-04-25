/**
 * Factory function for the export-service.
 *
 * @param {function} login - connection-service dependency provided.
 * @param {object} dataFileService - data-file-service dependency provided.
 * @return {object} export-service - provides functions for exporting data.
 */
module.exports = function(login, dataFileService) {

  /**
   * Process a list of json records for exporting data from a SF org.
   *
   * @param {array} queryObjects - Array of queryObjects.
   * @param {string} destinationDir - The destination directory for the exports.
   * @return {object} Promise that resolves when each of the queries resolve.
   */
  var exporter = function(queryObjects, destinationDir) {
    return login().then(function() {
      var fileNames = [];
      var queryPromises = queryObjects.map(function(qObj) {
        fileNames.push(qObj.getFileName());
        return qObj.doQuery();
      });
      return Promise.all(queryPromises)
        .then(handleQueryResults(queryObjects, destinationDir))
        .then(writeManifestFile(destinationDir, fileNames));
    });
  };

  var writeManifestFile = function(destinationDir, fileNames) {
    return function(fileResults) {
      var filePath = destinationDir + '/insertOrder.json';
      return dataFileService.writeManifestFile(filePath, fileNames);
    };
  };

  var handleQueryResults = function(queryObjects, destinationDir) {
    return function() {
      return Promise.all(queryObjects.map(qObj => {
        return dataFileService.writeDataFile(qObj.records,
              destinationDir + '/' + qObj.getFileName(),
              qObj.getType(),
              qObj.getId(),
              qObj.queries);
      }));
    };
  };

  return {
    export: exporter
  };
};
