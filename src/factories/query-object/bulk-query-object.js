/**
 * Factory function for BulkQueryObjects constructor.
 *
 * @param {function} QueryObject - QueryObject constructor.
 * @param {function} bulkQuery - bulk-query-service dependency provided.
 * @return {function} query-object-factory - Constructs QueryObject instances.
 */
module.exports = function(QueryObject, bulkQuery) {
  /**
   * BulkQueryObject inherits from QueryObject.
   * Uses the bulk API to retrieve the records.
   */
  function BulkQueryObject(queryObjectDatum) {
    QueryObject.call(this, queryObjectDatum);
  }

  BulkQueryObject.prototype = Object.create(QueryObject.prototype);
  BulkQueryObject.prototype.constructor = BulkQueryObject;

  BulkQueryObject.prototype.queryForRecords = function() {
    return bulkQuery(this.datum.query);
  };

  return BulkQueryObject;
};
