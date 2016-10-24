 /**
  * Factory function for the query-service.
  * @param {connection-service} login - Service for connecting to SF orgs.
  * @param {Promise} promise - promise dependecy injected.
  * @return query-service
  */
module.exports = function(login, promise) {
 /**
  * Runs a query against Salesforce Org.
  * @param {string} queryString - The SOQL query string.
  * @return Promise that resolves with the results of the query.
  */
  return function(queryString) {
    var deferred = new promise.Deferred();
    login().then(function(connection) {
      connection.query(queryString, function(err, result) {
        if (err) { deferred.reject(err); }
        return deferred.resolve(result.records);
      });
    });
    return deferred.promise;
  };
};
