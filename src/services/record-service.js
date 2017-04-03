/**
 * Factory function for the record-service.
 *
 * @param {function} login - Service for connecting to SF orgs.
 * @param {object} promise - Library dependency injection.
 * @param {function} logger - Function that logs a passed in string.
 * @return {object} record-service provides functions for managing SObject records.
 */
module.exports = function(login, promise, logger) {
  /**
   * Upserting a json record.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {object} record - The json record to be inserted.
   * @param {string} extId - External Id field for the json passed in for record.
   * @return {object} Promise that resolves with the result of the upsert.
   */
  var insertRecord = function(type, record, extId) {
    var deferred = new promise.Deferred();
    login().then(function(connection) {
      connection.sobject(type).upsert(record, extId, function(err, res2) {
        if (err) {
          logger('Upsert Failure: ' + type + ' ' + err + '\n\tId: ' + record[extId]);
          deferred.resolve(err);
        } else {
          logger('Upsert success: ' + type);
          deferred.resolve(res2);
        }
      });
    });
    return deferred.promise;
  };

  /**
   * Upserting a list of json records.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {array} records - The array of json records to be inserted.
   * @param {string} extId - External Id field for the json passed in for records.
   * @return {object} Promise that resolves when all records have been inserted.
   */
  var insertRecords = function(type, records, extId) {
    var deferred = new promise.Deferred();
    var fnArray = records.map(function(record, index) {
      record[extId] = record[extId] || index + 1;
      return function() {
        return insertRecord(type, record, extId);
      };
    });
    promise.seq(fnArray).then(function(results) {
      deferred.resolve(results);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Deleting an Sobject.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {string} id - The Id of the record to delete.
   * @return {object} Promise that resolves with the result of the delete.
   */
  var deleteRecord = function(type, id) {
    var deferred = new promise.Deferred();
    login().then(function(connection) {
      connection.del(type, id, function(err, rets) {
        if (err) { return deferred.reject(err); }
        logger(type + ' response: ' + JSON.stringify(rets));
        deferred.resolve(rets);
      });
    });
    return deferred.promise;
  };

  return {
    insertRecord: insertRecord,
    insertRecords: insertRecords,
    deleteRecord: deleteRecord,
    upsertRecord: insertRecord
  };
};
