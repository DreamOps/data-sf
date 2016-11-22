 /**
  * Factory function for the bulk-query-service.
  *
  * @param {function} login - Service for connecting to SF orgs.
  * @param {object} promise - promise dependecy injected.
  * @return {function} bulk-query-service executes a SOQL query using bulk API.
  */
module.exports = function(login, promise) {
 /**
  * Runs a query against Salesforce Org.
  *
  * @param {string} queryString - The SOQL query string.
  * @return {object} Promise that resolves with the results of the query.
  */
  return function(queryString) {
    var deferred = new promise.Deferred();
    var match = queryString.match(/FROM\s+(\w+)/i);
    var objectName = match[1];
    var records = [];
    login().then(function(connection) {
      var job = connection.bulk.createJob(objectName, 'query');
      var batch = job.createBatch();
      batch.on('queue', function(msg) {
        batch.poll(1000, 500000); // don't let the job timeout, poll every second
      });
      batch.execute(queryString, function(err, rets) {
        if (err) { return deferred.reject(err); }
        var dataStream = batch.result(rets[0].id);
        dataStream.on('record', function(record) {
          records.push(record);
        });
        dataStream.on('end', function() {
          job.close();
        });
      });
      job.on('close', function(jobInfo) {
        return deferred.resolve(records);
      });
    });
    return deferred.promise;
  };
};
