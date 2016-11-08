 /**
  * Factory function for the query-service.
  *
  * @param {function} login - Service for connecting to SF orgs.
  * @param {object} promise - promise dependecy injected.
  * @return {function} query-service executes a SOQL query.
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
    login().then(function(connection) {
      connection.query(queryString, function(err, result) {
        if (err) { deferred.reject(err); }
        return deferred.resolve(result.records);
      });
    });
    return deferred.promise;
  };
};
