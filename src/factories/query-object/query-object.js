/**
 * Factory function for QueryObjects constructor.
 *
 * @param {function} query - query-service dependency provided.
 * @param {function} bulkQuery - bulk-query-service dependency provided.
 * @param {object} promise - promise dependency provided.
 * @return {function} QueryObject - Constructs QueryObject instances.
 */
module.exports = function(query, bulkQuery, promise) {
  function QueryObject(queryObjectDatum) {
    this.datum = queryObjectDatum;
  };

  var mapFields = function(record, mappings) {
    delete record.attributes;
    mappings.forEach(function(mapping) {
      record[mapping.destColumn] = record[mapping.sourceColumn];
      delete record[mapping.sourceColumn];
    });
    return record;
  };

  var mapRecordTypes = function(record, recordTypeQueries) {
    if (record.RecordTypeId && recordTypeQueries) {
      record.RecordTypeId = '${' + recordTypeQueries[record.RecordTypeId].variable + '.Id}';
    }
    return record;
  };

  var getRecordTypeQuery = function(type, name) {
    var q = 'SELECT Id, Name, DeveloperName FROM RecordType' +
            ' WHERE SObjectType = \'' + type + '\' AND IsActive = true';
    if (name) { q += ' AND DeveloperName = \'' + name + '\''; }
    return q;
  };

  /**
   * Queries for record types based on the SObjectType and forms
   * query records for the exported json file.
   *
   * @return {object} The queryRecords for the resulting json file.
   */
  QueryObject.prototype.doQuery = function() {
    var deferred = new promise.Deferred();
    var self = this;
    promise.all([this.queryForRecords(), this.exportRecordTypes()]).then(function(results) {
      self.setRecords(results[0], results[1]);
      if (results[1]) { self.setQueries(results[1]); }
      deferred.resolve();
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   * Queries for record types based on the SObjectType and forms
   * query records for the exported json file.
   *
   * @return {object} The queryRecords for the resulting json file.
   */
  QueryObject.prototype.exportRecordTypes = function() {
    var deferred = new promise.Deferred();
    var self = this;
    query(getRecordTypeQuery(this.datum.type)).then(function(results) {
      deferred.resolve(results.reduce(function(total, result) {
        total[result.Id] = self.createRecordTypeQueryObject(result.DeveloperName);
        return total;
      }, {}));
    });
    return deferred.promise;
  };

  QueryObject.prototype.createRecordTypeQueryObject = function(name) {
    var queryString = getRecordTypeQuery(this.datum.type, name);
    return {variable: name + 'RT', query: queryString};
  };

  QueryObject.prototype.getFileName = function() {
    return this.datum.name.split(' ').join('_') + '.json';
  };

  QueryObject.prototype.getType = function() {
    return this.datum.type;
  };

  QueryObject.prototype.getId = function() {
    return this.datum.id;
  };

  QueryObject.prototype.setRecords = function(records, recordTypes) {
    var self = this;
    this.records = records.map(function(record) {
      return mapRecordTypes(mapFields(record, self.datum.mappings), recordTypes);
    });
  };

  QueryObject.prototype.setQueries = function(queries) {
    this.queries = Object.keys(queries).map(function(k) {
      return queries[k];
    });
  };

  QueryObject.prototype.queryForRecords = function() {
    return query(this.datum.query);
  };

  return QueryObject;
};
