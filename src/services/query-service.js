 /**
  * Factory function for the query-service.
  *
  * @param {function} login - Service for connecting to SF orgs.
  * @return {function} query-service executes a SOQL query.
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
      login()
        .then(connection => {
          connection.query(queryString, (err, result) => {
            if (err) { return reject(err); };
            resolve(result.records);
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  };
};
