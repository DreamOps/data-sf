/**
 * Factory function for the data-file-service.
 * @param {environment-service} environment - environment-service dependency provided.
 * @param {record-service} recordService - record-service dependency provided.
 * @param {apex-service} executeApex - apex-service dependecy provided.
 * @param {Promise} promise - promise dependency provided.
 * @return data-file-service
 */
module.exports = function(environment, recordService, executeApex, promise) {
  /**
   * Processes the queries and records properties of a json data file.
   * Builds the environment based on the queries and replaces the data
   * for each of the records to be inserted. Finally, inserting all the records.
   * @param {object} data - The json data file to be processed.
   * @return Promise that resolves when all the record insertions finish.
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
      promise.seq(fnArray).then(function(results) {
        deferred.resolve();
      });
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Process a list of json records for cleaning a SF org.
   * @param {array} records - Array of JSON records for running anonymous apex.
   * @return Promise that resolves when each of the records finishes executing.
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
