/**
 * Factory function for the record-service.
 *
 * @param {function} login - Service for connecting to SF orgs.
 * @param {object} promise - Library dependency injection.
 * @param {function} logger - Function that logs a passed in string.
 * @return {object} record-service provides functions for managing SObject records.
 */
module.exports = function(login, promise, logger, jsforcePartnerService, _) {
  /**
   * Insert a json record.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {object} record - The json record to be inserted.
   * @return {object} Promise that resolves with the result of the upsert.
   */
  var insertRecord = function(type, record) {
    var deferred = new promise.Deferred();
    login().then(function(connection) {
      connection.sobject(type).insert(record, function(err, res2) {
        if (err) {
          logger('Insert Failure: ' + type + ' ' + err);
          deferred.resolve(err);
        } else {
          logger('Insert success: ' + type);
          deferred.resolve(res2);
        }
      });
    });
    return deferred.promise;
  };

  /**
   * Insterting a list of json records.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {array} records - The array of json records to be inserted.
   * @return {object} Promise that resolves when all records have been inserted.
   */
  var insertRecords = function(type, records) {
    var deferred = new promise.Deferred();
    var fnArray = records.map(function(record, index) {
      return function() {
        return insertRecord(type, record);
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
   * Upserting a json record.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {object} record - The json record to be inserted.
   * @param {string} extId - External Id field for the json passed in for record.
   * @return {object} Promise that resolves with the result of the upsert.
   */
  var upsertRecord = function(type, record, extId) {
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
  var upsertRecords = function(type, records, extId) {
    extId = extId || 'NU__ExternalID__c';

    return jsforcePartnerService.describeSObjects([type]).then(function(describe) {
      records = records.map(function(record, index) {
        var result = {'type': type};
        _.forOwn(record, function(value, key) {
          if (value === null || value === undefined || value === '') {
            result[key] = {'@xsi:nil': 'true'};
          } else {
            if (key.indexOf('.') == -1) {
              result[key] = value;
            } else {
              var split = key.split('.');
              var lookupField = split[0];
              var idField = split[1];
              var fieldDescribe = describe.fields.find(function(field) {
                return field.relationshipName === lookupField;
              });
              if (!fieldDescribe) {
                throw 'Unknown field: ' + lookupField;
              }
              if (!fieldDescribe.referenceTo) {
                throw 'Field is not a relationship: ' + lookupField;
              }
              result[lookupField] = {
                type: fieldDescribe.referenceTo,
                [idField]: value
              };
            }
          }
        });
        result[extId] = record[extId] || index + 1;
        return result;
      });

      var chunks = _.chunk(records, 200);
      var index = 0;
      var fnArray = chunks.map(function(chunk) {
        return function() {
          return jsforcePartnerService.upsert(extId, chunk).then(function(results) {
            results.forEach(function(result) {
              if (result.success) {
                logger(type + ' ' + (++index) + ' loaded successfully, id = ' + result.id);
              } else {
                logger(type + ' ' + (++index) + ' error occurred, message = ' +
                    result.errors.map(e => e.message).join(', '));
              }
            });
          }, function(err) {
            logger(err);
          });
        };
      });
      return promise.seq(fnArray);
    });
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
    upsertRecords: upsertRecords,
    deleteRecord: deleteRecord,
    upsertRecord: upsertRecord
  };
};
