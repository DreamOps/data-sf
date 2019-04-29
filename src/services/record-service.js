const promiseHelper = require('../utilities/promise');

/**
 * Factory function for the record-service.
 *
 * @param {function} login - Service for connecting to SF orgs.
 * @param {function} logger - Function that logs a passed in string.
 * @return {object} record-service provides functions for managing SObject records.
 */
module.exports = function(login, logger, jsforcePartnerService, _) {
  /**
   * Insert a json record.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {object} record - The json record to be inserted.
   * @return {object} Promise that resolves with the result of the upsert.
   */
  var insertRecord = function(type, record) {
    return new Promise((resolve, reject) => {
      login()
        .then(connection => {
          connection.sobject(type).insert(record, (err, res2) => {
            if (err) {
              logger('Insert Failure: ' + type + ' ' + err);
              return resolve(err);
            }

            logger('Insert success: ' + type);
            resolve(res2);
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  /**
   * Insterting a list of json records.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {array} records - The array of json records to be inserted.
   * @return {object} Promise that resolves when all records have been inserted.
   */
  var insertRecords = function(type, records) {
    return new Promise((resolve, reject) => {
      var promises = records.map(record => {
        return function() {
          return insertRecord(type, record);
        };
      });

      promiseHelper.seq(promises)
        .then(results => {
          resolve(results);
        })
        .catch(err => {
          reject(err);
        });
    });
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
    return new Promise((resolve, reject) => {
      login()
        .then(connection => {
          connection.sobject(type).upsert(record, extId, (err, res2) => {
            if (err) {
              logger('Upsert Failure: ' + type + ' ' + err + '\n\tId: ' + record[extId]);
              return resolve(err);
            }
            logger('Upsert success: ' + type);
            resolve(res2);
          });
        });
    });
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
      var promises = chunks.map(chunk => {
        return function() {
          return jsforcePartnerService.upsert(extId, chunk)
            .then(results => {
              results.forEach(result => {
                if (result.success) {
                  logger(type + ' ' + (++index) + ' loaded successfully, id = ' + result.id);
                } else {
                  logger(type + ' ' + (++index) + ' error occurred, message = ' +
                      result.errors.map(e => e.message).join(', '));
                }
              });
            })
            .catch(err => {
              logger(err);
            });
        };
      });

      return promiseHelper.seq(promises);
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
    return login().then(connection => {
      return connection.del(type, id).then(rets => {
        logger(type + ' response: ' + JSON.stringify(rets));
      });
    });
  };

  return {
    insertRecord: insertRecord,
    insertRecords: insertRecords,
    upsertRecords: upsertRecords,
    deleteRecord: deleteRecord,
    upsertRecord: upsertRecord
  };
};
