/**
 * Factory function for the export-service.
 *
 * @param {function} login - connection-service dependency provided.
 * @param {function} query - query-service dependency provided.
 * @param {function} bulkQuery - bulk-query-service dependency provided.
 * @param {object} dataFileService - data-file-service dependency provided.
 * @param {object} promise - promise dependency provided.
 * @return {object} export-service - provides functions for exporting data.
 */
module.exports = function(login, query, bulkQuery, dataFileService, promise) {
  /**
   * Process a list of json records and maps fields based on the passed in mappings.
   * Deletes the attributes field if the record has one.
   *
   * @param {object} record - A JSON Sobject record.
   * @param {array} mappings - Array of JSON records for mapping Sobject fields.
   * The records in the mappings param should adhere to the following interface:
   * {
   *    "sourceColumn": "Id",
   *    "destColumn": "NU__ExternalID__c"
   * }
   * @return {object} The record with it's fields mapped, and each sourceColumn deleted.
   */
  var mapFields = function(record, mappings) {
    delete record.attributes;
    mappings.forEach(function(mapping) {
      record[mapping.destColumn] = record[mapping.sourceColumn];
      delete record[mapping.sourceColumn];
    });
    return record;
  };

  var mapRecordTypes = function(record, recordTypeQueries) {
    if (record.RecordTypeId) {
      record.RecordTypeId = '${' + recordTypeQueries[record.RecordTypeId].variable + '.Id}';
    }
    return record;
  };

  /**
   * Queries for record types based on the given SObjectType and forms
   * query records for the exported json file.
   *
   * @param {string} sObjectType - A SObjectType from the target SF org.
   * @return {object} The queryRecords for the resulting json file.
   */
  var exportRecordTypes = function(sObjectType) {
    var deferred = new promise.Deferred();
    var recordTypeQuery = 'SELECT Id, Name, DeveloperName FROM RecordType' +
                          ' WHERE SObjectType = \'' + sObjectType + '\' AND IsActive = true';
    var createRecordTypeQueryObject = function(name) {
      var queryString = 'SELECT Id FROM RecordType WHERE SObjectType = \'' + sObjectType + '\'' +
                        ' AND IsActive = true AND DeveloperName = \'' + name + '\'';
      return {variable: name + 'RT', query: queryString};
    };
    query(recordTypeQuery).then(function(results) {
      var queryRecords = {};
      results.forEach(function(result) {
        queryRecords[result.Id] = createRecordTypeQueryObject(result.DeveloperName);
      });
      deferred.resolve(queryRecords);
    });
    return deferred.promise;
  };

  /**
   * Process a list of json records for exporting data from a SF org.
   *
   * @param {array} queryObjects - Array of JSON records for querying SObjects.
   * The records in the queryObjects param should adhere to the following interface:
   * {
   *   name: 'The name of the export',
   *   query: 'SOQL query for the data to export',
   *   type: 'The type of the query',
   *   useBulk: true || false,
   *   mappings: [
   *     {
   *        "sourceColumn": "Id",
   *        "destColumn": "NU__ExternalID__c"
   *     },...
   *   ]
   * }
   * @param {string} destinationDir - The destination directory for the exports.
   * @return {object} Promise that resolves when each of the queries resolve.
   */
  var exporter = function(queryObjects, destinationDir) {
    var deferred = new promise.Deferred();
    var allKeys = promise.allKeys;
    login().then(function() {
      var promises = {};
      var fileNames = [];
      queryObjects.forEach(function(qObj) {
        if (qObj.useBulk) {
          promises[qObj.name] = bulkQuery(qObj.query);
        } else {
          promises[qObj.name] = query(qObj.query);
        }
        if (!promises[qObj.type]) {
          promises[qObj.type] = exportRecordTypes(qObj.type);
        }
      });
      allKeys(promises).then(function(queryResults) {
        var filePromises = {};
        queryObjects.forEach(function(qObj) {
          var records = queryResults[qObj.name].map(function(record) {
            record = mapFields(record, qObj.mappings);
            record = mapRecordTypes(record, queryResults[qObj.type]);
            return record;
          });
          fileNames.push(qObj.name.split(' ').join('_') + '.json');
          var filePath = destinationDir + '/' + fileNames[fileNames.length - 1];
          var queries = Object.keys(queryResults[qObj.type]).map(function(k) {
            return queryResults[qObj.type][k];
          });
          filePromises[qObj.name] =
            dataFileService.writeDataFile(records, filePath, qObj.type, qObj.id, queries);
        });
        return allKeys(filePromises);
      }).then(function(fileResults) {
        var filePath = destinationDir + '/insertOrder.json';
        return dataFileService.writeManifestFile(filePath, fileNames);
      }).then(function(manifestResult) {
        deferred.resolve();
      }, function(err) {
        deferred.reject(err);
      });
    });
    return deferred.promise;
  };

  return {
    export: exporter,
    mapFields: mapFields,
    exportRecordTypes: exportRecordTypes
  };
};
