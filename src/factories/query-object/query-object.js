/**
 * Factory function for QueryObjects constructor.
 *
 * @param {function} query - query-service dependency provided.
 * @param {object} promise - promise dependency provided.
 * @return {function} QueryObject - Constructs QueryObject instances.
 */
module.exports = function(query, promise) {
  function QueryObject(queryObjectDatum) {
    this.datum = queryObjectDatum;
  };

  /**
   * Queries using the query property returned by getQuery().
   *
   * @return {object} The queryRecords for the resulting json file.
   */
  QueryObject.prototype.doQuery = function() {
    var deferred = new promise.Deferred();
    var self = this;
    query(this.getQuery()).then(function(results) {
      self.records = results;
      deferred.resolve();
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  QueryObject.prototype.getFileName = function() {
    return this.getName().split(' ').join('_') + '.json';
  };

  QueryObject.prototype.getType = function() {
    return this.datum.type;
  };

  QueryObject.prototype.getQuery = function() {
    return this.datum.query;
  };

  QueryObject.prototype.getId = function() {
    return this.datum.id;
  };

  QueryObject.prototype.getName = function() {
    if (this.datum.name) {
      return this.datum.name;
    }
    return this.datum.variable;
  };

  QueryObject.prototype.getMappings = function() {
    return this.datum.mappings;
  };

  QueryObject.prototype.formatRecords = function(formatter) {
    return formatter(this.records);
  };

  return QueryObject;
};
