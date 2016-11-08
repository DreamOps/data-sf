/**
 * Factory function for the bulk-record-service.
 *
 * @param {function} login - Service for connecting to SF orgs.
 * @param {object} promise - Library dependency injection.
 * @param {function} logger - Function that logs a passed in string.
 * @return {object} record-service
 */
module.exports = function(login, promise, logger) {

  /**
   * Takes an array of records and maps __r fields from objects to
   * flat field references. JSON record relationship fields are mapped
   * by objects referencing indexed fields from the related object.
   * { NU__Entity__r: { NU__ExternalID__c: 'PRIMARY' } } where the
   * related Entity has an NU__ExternalID__c field set to primary.
   * The bulk API requires that the fields are flat like the following
   * { 'NU__Entity__r.NU__ExternalID__c': 'PRIMARY' }
   *
   * @param {array} records - Array of records to map relationship fields.
   * @return {array} Array of records that is mapped.
   */
  var mapRelationshipFields = function(records) {
    return records.map(function(record) {
      Object.keys(record).forEach(function(field) {
        if (field.endsWith('__r') && record[field] instanceof Object) {
          var subIdField = Object.keys(record[field])[0];
          var newField = field + '.' + subIdField;
          record[newField] = record[field][subIdField];
          delete record[field];
        }
      });
      return record;
    });
  };

  /**
   * inserting a list of json records using the bulk API.
   *
   * @param {string} type - The SobjectType that we are inserting.
   * @param {array} records - The array of json records to be inserted.
   * @param {string} extId - External Id field for the json passed in for records.
   * @return {object} Promise that resolves when all records have been inserted.
   */
  var insertRecords = function(type, records, extId) {
    var deferred = new promise.Deferred();

    //set externalIds if it is not already set.
    extId = extId || 'NU__ExternalID__c';
    records = records.map(function(record, index) {
      record[extId] = record[extId] || index + 1;
      return record;
    });

    //map the relationship fields for the bulk API
    records = mapRelationshipFields(records);

    login().then(function(conn) {
      var job = conn.bulk.createJob(type, 'upsert', {extIdField: extId});
      var batch = job.createBatch();
      batch.on('queue', function(batchInfo) {
        //poll the batch every second, timeout after 200s
        batch.poll(1000, 200000);
        logger('batch is queued, jobId: ' + batchInfo.jobId +
               ' batchId: ' + batchInfo.batchId);
      });

      batch.execute(records, function(err, rets) {
        if (err) { return deferred.reject(err); }

        for (var i = 0; i < rets.length; i++) {
          if (rets[i].success) {
            logger(type + ' ' + (i + 1) + ' loaded successfully, id = ' + rets[i].id);
          } else {
            logger(type + ' ' + (i + 1) + ' error occurred, message = ' + rets[i].errors.join(', '));
          }
        }
        job.close();
      });

      job.on('close', function(jobInfo) {
        logger('Job Completed for ' + jobInfo.object);
        logger('Total Batches ' + jobInfo.numberBatchesTotal);
        logger('Total Records ' + jobInfo.numberRecordsProcessed);
        logger('Total Processing Time ' + jobInfo.totalProcessingTime);
        return deferred.resolve(jobInfo);
      });
    });
    return deferred.promise;
  };

  return {
    insertRecords: insertRecords,
    mapRelationshipFields: mapRelationshipFields
  };
};