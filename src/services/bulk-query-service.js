 /**
  * Factory function for the bulk-query-service.
  *
  * @param {function} login - Service for connecting to SF orgs.
  * @return {function} bulk-query-service executes a SOQL query using bulk API.
  */
module.exports = function(login) {
 /**
  * Runs a query against Salesforce Org.
  *
  * @param {string} queryString - The SOQL query string.
  * @return {object} Promise that resolves with the results of the query.
  */
  return function(queryString) {
    return new Promise((resolve, reject) => {
      var match = queryString.match(/FROM\s+(\w+)/i);
      var objectName = match[1];
      var records = [];
      login()
        .then(connection => {
          var job = connection.bulk.createJob(objectName, 'query');
          var batch = job.createBatch();
          batch.on('queue', () => {
            batch.poll(1000, 500000); // don't let the job timeout, poll every second
          });
          batch.execute(queryString, (err, rets) => {
            if (err) { return reject(err); }
            var dataStream = batch.result(rets[0].id);
            dataStream.on('record', record => {
              records.push(record);
            });
            dataStream.on('end', () => {
              job.close();
            });
          });
          job.on('close', () => {
            return resolve(records);
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  };
};
