/**
* Connects JSforce to the configured server.
*
* @param {object} jsforce - Dependency on jsforce provided.
* @param {object} config - Configuration (username, password, url, or instanceUrl, jwt) provided.
* @return {function} Call this function to connect to SF through jsforce.
*/
module.exports = function(jsforce, config) {
  var _loggedInConnection;
  var connect;

  if (config.instanceUrl && config.jwt) {
    connect = function() {
      return new Promise((resolve, reject) => {
        var conn = new jsforce.Connection();
        conn.initialize({
          instanceUrl: config.instanceUrl,
          accessToken: config.jwt
        });
        resolve(conn);
      });
    };
  } else {
    connect = function() {
      return new Promise((resolve, reject) => {
        var conn = new jsforce.Connection({loginUrl: config.url});
        conn.login(config.username, config.password, function(err, res) {
          if (err) { return reject(err); }
          resolve(conn);
        });
      });
    };
  }

  /**
   * Function to login to the configured server.
   *
   * @return {object} Promise that resolves with the connection when the connection finishes.
   */
  return function() {
    if (_loggedInConnection === undefined) {
      return connect().then(conn => {
        _loggedInConnection = conn;
      });
    } else {
      return Promise.resolve(_loggedInConnection);
    }
  };
};
