/**
 * Factory function for ExportQueryObjects constructor.
 *
 * @param {function} QueryObject - QueryObject constructor.
 * @param {function} query - query-service dependency provided.
 * @return {function} query-object-factory - Constructs QueryObject instances.
 */
module.exports = function(QueryObject, query, promise) {
  /**
   * ExportQueryObject inherits from QueryObject.
   * Uses the bulk API to retrieve the records.
   */
  function ExportQueryObject(queryObjectDatum) {
    QueryObject.call(this, queryObjectDatum);
  }

  ExportQueryObject.prototype = Object.create(QueryObject.prototype);
  ExportQueryObject.prototype.constructor = ExportQueryObject;

  var mapFields = function(record, mappings) {
    delete record.attributes;
    mappings.forEach(mapIndividual(record));
    return record;
  };

  var mapIndividual = function(record) {
    return function(mapping) {
      if (mapping.sourceColumn) {
        record[mapping.destColumn] = record[mapping.sourceColumn];
        delete record[mapping.sourceColumn];
      } else if (mapping.value) {
        record[mapping.destColumn] = mapping.value;
      }
    };
  };

  var mapRecordTypes = function(record, recordTypeQueries) {
    if (record.RecordTypeId && recordTypeQueries && recordTypeQueries[record.RecordTypeId]) {
      record.RecordTypeId = '${' + recordTypeQueries[record.RecordTypeId].variable + '.Id}';
    }
    return record;
  };

  var getRecordTypeQuery = function(type, name) {
    var q = 'SELECT Id, Name FROM RecordType' +
            ' WHERE SObjectType = \'' + type + '\' AND IsActive = true';
    if (name) { q += ' AND Name = \'' + name + '\''; }
    return q;
  };

  /**
   * Queries for record types based on the SObjectType and forms
   * query records for the exported json file.
   *
   * @return {object} The queryRecords for the resulting json file.
   */
  ExportQueryObject.prototype.exportRecordTypes = function() {
    var deferred = new promise.Deferred();
    var self = this;
    query(getRecordTypeQuery(this.getType())).then(function(results) {
      deferred.resolve(results.reduce(function(total, result) {
        total[result.Id] = self.createRecordTypeQueryObject(result.Name);
        return total;
      }, {}));
    });
    return deferred.promise;
  };

  ExportQueryObject.prototype.createRecordTypeQueryObject = function(name) {
    var queryString = getRecordTypeQuery(this.getType(), name);
    return {variable: name + 'RT', query: queryString};
  };

  /**
   * Queries for record types based on the SObjectType and forms
   * query records for the exported json file.
   *
   * @return {object} The queryRecords for the resulting json file.
   */
  ExportQueryObject.prototype.doQuery = function() {
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

  ExportQueryObject.prototype.setQueries = function(queries) {
    this.queries = Object.keys(queries).map(function(k) {
      return queries[k];
    });
  };

  ExportQueryObject.prototype.queryForRecords = function() {
    return query(this.getQuery());
  };

  ExportQueryObject.prototype.setRecords = function(records, recordTypes) {
    var mappings = this.getMappings();
    this.records = records.map(function(record) {
      return mapRecordTypes(mapFields(record, mappings), recordTypes);
    });
  };

  return ExportQueryObject;
};