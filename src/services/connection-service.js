/**
* Connects JSforce to the configured server,
* @param {object} jsforce - Dependency on jsforce provided.
* @param {Promise} promise - Dependency on Promise library provided.
* @param {object} config - Configuration (username, password, url ...) provided.
* @return connection-service.
*/
module.exports = function(jsforce, promise, config) {
  var conn = new jsforce.Connection({loginUrl: config.url});
  var _loggedInConnection;

  /**
   * Function to login to the configured server
   * @return Promise that resolves with the connection when the connection finishes.
   */
  return function() {
    var deferred = new promise.Deferred();
    if (_loggedInConnection === undefined) {
      conn.login(config.username, config.password, function(err, res) {
        if(err) { return deferred.reject(err); }
        _loggedInConnection = conn;
        deferred.resolve(_loggedInConnection);
      });
    } else {
      deferred.resolve(_loggedInConnection);
    }
    return deferred.promise;
  };
};
