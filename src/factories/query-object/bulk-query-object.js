/**
 * Factory function for BulkQueryObjects constructor.
 *
 * @param {function} ExportQueryObject - ExportQueryObject constructor.
 * @param {function} bulkQuery - bulk-query-service dependency provided.
 * @return {function} query-object-factory - Constructs QueryObject instances.
 */
module.exports = function(ExportQueryObject, bulkQuery) {
  /**
   * BulkQueryObject inherits from ExportQueryObject.
   * Uses the bulk API to retrieve the records.
   */
  function BulkQueryObject(queryObjectDatum) {
    ExportQueryObject.call(this, queryObjectDatum);
  }

  BulkQueryObject.prototype = Object.create(ExportQueryObject.prototype);
  BulkQueryObject.prototype.constructor = BulkQueryObject;

  BulkQueryObject.prototype.queryForRecords = function() {
    return bulkQuery(this.datum.query);
  };

  return BulkQueryObject;
};
