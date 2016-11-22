/**
 * Factory function for the apex-service.
 *
 * @param {function} login - Dependency on the connection-service provided.
 * @param {Promise} promise - Promise library dependency provided.
 * @param {object} util - Instance of the node util class.
 * @param {function} logger - Function that prints a passed in string.
 * @return {function} apex-service
 */
module.exports = function(login, promise, util, logger) {
  /**
  * Execute an apexBody and resolve with the result when it finishes.
  *
  * @param {string} apexBody - String of apex to execute on the server.
  * @return {object} Promise that resolves with the execution result when the execution finishes.
  */
  return function(apexBody) {
    var deferred = new promise.Deferred();
    login().then(function(connection) {
      connection.tooling.executeAnonymous(apexBody, function(err, res) {
        if (err) { return deferred.reject(err); }
        if (!res.compiled) {
          return deferred.reject(res.compileProblem);
        }
        logger('successful executeAnonymous ' + util.inspect(res));
        deferred.resolve(res);
      });
    });
    return deferred.promise;
  };
};
