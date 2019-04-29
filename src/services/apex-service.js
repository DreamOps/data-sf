/**
 * Factory function for the apex-service.
 *
 * @param {function} login - Dependency on the connection-service provided.
 * @param {object} util - Instance of the node util class.
 * @param {function} logger - Function that prints a passed in string.
 * @return {function} apex-service
 */
module.exports = function(login, util, logger) {
  /**
  * Execute an apexBody and resolve with the result when it finishes.
  *
  * @param {string} apexBody - String of apex to execute on the server.
  * @return {object} Promise that resolves with the execution result when the execution finishes.
  */
  return function(apexBody) {
    return login().then(connection => {
      return connection.tooling.executeAnonymous(apexBody);
    }).then(res => {
      if (!res.compiled) {
          throw res.compileProblem;
      }
      logger('successful executeAnonymous ' + util.inspect(res));
    });
  };
};
