const promiseHelper = require('../utilities/promise');

/**
 * Factory function for the data-file-service.
 *
 * @param {object} environment - environment-service dependency provided.
 * @param {object} recordService - record-service dependency provided.
 * @param {function} executeApex - apex-service dependecy provided.
 * @param {object} fs - file system dependency provided.
 * @return {object} data-file-service provides functions for managing json data files.
 */
module.exports = function(environment, recordService, executeApex, fs) {
  /**
   * Processes the queries and records properties of a json data file.
   * Builds the environment based on the queries and replaces the data
   * for each of the records to be inserted. Finally, inserting all the records.
   *
   * @param {object} data - The json data file to be processed.
   * @return {object} Promise that resolves when all the record insertions finish.
   */
  var processDataInsert = function(data) {
    return environment.buildEnvironment(data.queries).then(function(variables) {
      var fnArray = Object.keys(data.records).map(function(type) {
        var jsonRecords = data.records[type];
        var recordsToInsert = environment.replaceVariables(jsonRecords, variables);
        return function() {
          return recordService.insertRecords(type, recordsToInsert, data.extId);
        };
      });

      return promiseHelper.seq(fnArray);
    });
  };

  /**
   * Processes the queries and records properties of a json data file.
   * Builds the environment based on the queries and replaces the data
   * for each of the records to be inserted. Finally, inserting all the records.
   *
   * @param {object} data - The json data file to be processed.
   * @return {object} Promise that resolves when all the record insertions finish.
   */
  var processData = function(data) {
    return environment.buildEnvironment(data.queries).then(function(variables) {
      var fnArray = Object.keys(data.records).map(function(type) {
        var jsonRecords = data.records[type];
        var recordsToInsert = environment.replaceVariables(jsonRecords, variables);
        return function() {
          return recordService.upsertRecords(type, recordsToInsert, data.extId);
        };
      });

      return promiseHelper.seq(fnArray);
    });
  };

  var obfuscateEmails = function(rawData) {
    var data = JSON.stringify(rawData);
    var res = data.split('@').join('@zzz');
    return JSON.parse(res);
  };

  /**
   * Process a list of json records for cleaning a SF org.
   *
   * @param {array} records - Array of JSON records for running anonymous apex.
   * @return {object} Promise that resolves when each of the records finishes executing.
   */
  var cleanData = function(records) {
    var promises = records.map(function(record) {
      if (record.type === 'ApexScript') {
        return function() {
          return executeApex(record.body.join('\n'));
        };
      }
    });
    return promiseHelper.seq(promises);
  };

  var templateJson = {
    extId: undefined,
    queries: undefined,
    records: {},
    cleaners: []
  };

  var templateManifest = {
    manifest: true,
    order: []
  };

  /**
   * Write a json data file to disk.
   *
   * @param {array} records - Array of JSON SObject records.
   * @param {string} destination - The location to save the new file.
   * @param {string} type - The SObject type of the records being passed in.
   * @param {string} extId - The extId property in the data file.
   * @param {array} queries - The queries property in the data file, an array of query objects.
   * @return {object} Promise that resolves when the file is written.
   */
  var writeDataFile = function(records, destination, type, extId, queries) {
    var fileJson = JSON.parse(JSON.stringify(templateJson));
    fileJson.records[type] = records;
    fileJson.extId = extId || 'NU__ExternalID__c';
    fileJson.queries = queries || [];
    return new Promise((resolve, reject) => {
      fs.writeFile(destination, JSON.stringify(fileJson, null, 2), err => {
        if (err) { return reject(err); };
        resolve();
      });
    });
  };

  /**
   * Write a manifest file for loading other json data files.
   *
   * @param {string} destination - The file to write.
   * @param {array} fileNames - Array of string file names for the manifest.
   * @return {object} Promise that resolves when the file is written.
   */
  var writeManifestFile = function(destination, fileNames) {
    var fileJson = JSON.parse(JSON.stringify(templateManifest));
    fileJson.order = fileNames;
    return new Promise((resolve, reject) => {
      fs.writeFile(destination, JSON.stringify(fileJson, null, 2), err => {
        if (err) { return reject(err); };
        resolve();
      });
    });
  };

  return {
    processData: processData,
    processDataInsert, processDataInsert,
    cleanData: cleanData,
    writeDataFile: writeDataFile,
    writeManifestFile: writeManifestFile,
    obfuscateEmails: obfuscateEmails
  };
};
