/**
 * Factory function for environment-service.
 *
 * @param {function} query - query-service dependency injection.
 * @param {Promise} promise - promise library dependency injection.
 * @return {object} environment-service provides functions for building an environment via queries.
 */
module.exports = function(query, promise) {
  /**
   * Queries data from a SF org and returns a result
   * object for replacing variables.
   *
   * @param {object} queryObj - An object adhering to following interface:
   *                            { variable: 'SomeString', query: 'SELECT Id FROM...' }
   * @return {object} Object adhering to the following interface:
   *         { variable: 'SomeString', data: {... query results...} }
   */
  var queryData = function(queryObj) {
    var deferred = new promise.Deferred();
    query(queryObj.query).then(function(results) {
      //if it is only one record return that record
      if (results.length === 1) {
        return deferred.resolve({variable: queryObj.variable, data: results[0]});
      }
      return deferred.resolve({variable: queryObj.variable, data: results});
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Takes an array of queryObjects:
   * { variable: 'SomeString', query: 'SELECT Id FROM...' }
   * Resolves with an object, whos keys are all the variable
   * properties, and whose values are represented by the query
   * properties.
   *
   * @param {array} queryObjects - Array of objects adhering to this interface:
   *                               { variable: 'SomeString', query: 'SELECT Id FROM...' }
   * @return {object} - A promise that resolves with an object whose keys are the
   *                     variable properties, and whose values are the results of the queries.
   */
  var buildEnvironment = function(queryObjects) {
    var deferred = new promise.Deferred();
    var variables = {};
    var promises = queryObjects.map(function(q) {
      return queryData(q);
    });
    promise.all(promises).then(function(results) {
      results.forEach(function(result) {
        variables[result.variable] = result.data;
      });
      deferred.resolve(variables);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Replacing variables in an array of json records.
   *
   * @param {array} records - Array of json objects.
   * @param {object} variables - Object whose fields are variables
   *                             and whose values are the data to replace with.
   * @return {array} Array of records whose values are replaced with the variables.
   */
  var replaceVariables = function(records, variables) {
    var re = /\$\{(.+)\}/;
    var replacer = function(match, expression) {
      var tokens = expression.split('.');
      var fieldValue = variables[tokens[0]];
      if (fieldValue) {
        return fieldValue[tokens[1]];
      }
      return '${' + expression + '}';
    };

    return records.map(function(record) {
      var newRecord = {};
      Object.keys(record).forEach(function(field) {
        newRecord[field] = record[field];
        if (typeof newRecord[field] === 'string') {
          newRecord[field] = newRecord[field].replace(re, replacer);
        }
      });
      return newRecord;
    });
  };

  return {
    queryData: queryData,
    buildEnvironment: buildEnvironment,
    replaceVariables: replaceVariables
  };
};
