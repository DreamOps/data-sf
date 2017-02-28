/**
 * Factory function for environment-service.
 *
 * @param {function} queryObjectFactory - factory for query objects.
 * @param {Promise} promise - promise library dependency injection.
 * @return {object} environment-service provides functions for building an environment via queries.
 */
module.exports = function(queryObjectFactory, promise) {
  var formatter = function(records) {
    return (records && records.length === 1) ? records[0] : records;
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
    queryObjects = queryObjectFactory(queryObjects);
    var promises = queryObjects.map(function(q) {
      return q.doQuery();
    });
    promise.all(promises).then(function() {
      queryObjects.forEach(function(q) {
        variables[q.getName()] = q.formatRecords(formatter);
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
    buildEnvironment: buildEnvironment,
    replaceVariables: replaceVariables
  };
};
