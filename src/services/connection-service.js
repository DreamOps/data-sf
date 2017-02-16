/**
* Connects JSforce to the configured server.
*
* @param {object} jsforce - Dependency on jsforce provided.
* @param {Promise} promise - Dependency on Promise library provided.
* @param {object} config - Configuration (username, password, url, or instanceUrl, jwt) provided.
* @return {function} Call this function to connect to SF through jsforce.
*/
module.exports = function(jsforce, promise, config) {
  var _loggedInConnection;
  var connect;

  if (config.instanceUrl && config.jwt) {
    connect = function() {
      var deferred = new promise.Deferred();
      var conn = new jsforce.Connection();
      conn.initialize({
        instanceUrl: config.instanceUrl,
        accessToken: config.jwt
      });
      deferred.resolve(conn);
      return deferred.promise;
    };
  } else {
    connect = function() {
      var deferred = new promise.Deferred();
      var conn = new jsforce.Connection({loginUrl: config.url});
      conn.login(config.username, config.password, function(err, res) {
        if (err) { return deferred.reject(err); }
        deferred.resolve(conn);
      });
      return deferred.promise;
    };
  }

  /**
   * Function to login to the configured server.
   *
   * @return {object} Promise that resolves with the connection when the connection finishes.
   */
  return function() {
    var deferred = new promise.Deferred();
    if (_loggedInConnection === undefined) {
      connect().then(function(conn) {
        _loggedInConnection = conn;
        deferred.resolve(_loggedInConnection);
      }, function(err) {
        deferred.reject(err);
      });
    } else {
      deferred.resolve(_loggedInConnection);
    }
    return deferred.promise;
  };
};
