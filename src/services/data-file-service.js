/**
 * Factory function for the data-file-service.
 *
 * @param {object} environment - environment-service dependency provided.
 * @param {object} recordService - record-service dependency provided.
 * @param {function} executeApex - apex-service dependecy provided.
 * @param {object} promise - promise dependency provided.
 * @return {object} data-file-service provides functions for managing json data files.
 */
module.exports = function(environment, recordService, executeApex, promise) {
  /**
   * Processes the queries and records properties of a json data file.
   * Builds the environment based on the queries and replaces the data
   * for each of the records to be inserted. Finally, inserting all the records.
   *
   * @param {object} data - The json data file to be processed.
   * @return {object} Promise that resolves when all the record insertions finish.
   */
  var processData = function(data) {
    var deferred = new promise.Deferred();
    environment.buildEnvironment(data.queries).then(function(variables) {
      var fnArray = Object.keys(data.records).map(function(type) {
        var jsonRecords = data.records[type];
        var recordsToInsert = environment.replaceVariables(jsonRecords, variables);
        return function() {
          return recordService.insertRecords(type, recordsToInsert, data.extId);
        };
      });
      return promise.seq(fnArray);
    }).then(function(results) {
      deferred.resolve();
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Process a list of json records for cleaning a SF org.
   *
   * @param {array} records - Array of JSON records for running anonymous apex.
   * @return {object} Promise that resolves when each of the records finishes executing.
   */
  var cleanData = function(records) {
    var deferred = new promise.Deferred();
    var promises = records.map(function(record) {
      if (record.type === 'ApexScript') {
        return executeApex(record.body.join('\n'));
      }
    });
    promise.all(promises).then(function(results) {
      deferred.resolve();
    }, function(err) { deferred.reject(err); });
    return deferred.promise;
  };

  return {
    processData: processData,
    cleanData: cleanData
  };
};
