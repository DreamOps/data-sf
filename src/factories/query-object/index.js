/**
 * Factory function for QueryObjects.
 *
 * @param {function} query - query-service dependency provided.
 * @param {function} bulkQuery - bulk-query-service dependency provided.
 * @param {object} promise - promise dependency provided.
 * @return {function} query-object-factory - Constructs QueryObject instances.
 */
module.exports = function(query, bulkQuery, promise) {
  QueryObject = require('./query-object')(query, promise);
  ExportQueryObject = require('./export-query-object')(QueryObject, query, promise);
  BulkQueryObject = require('./bulk-query-object')(ExportQueryObject, bulkQuery);
  /**
   * Factory function for QueryObjects
   *
   * @param {array} queryObjectData - Array of JSON records for querying SObjects.
   * The records in the queryObjects param should adhere to the following interface:
   * {
   *   name: 'The name of the export', //this field can also be named variable
   *   query: 'SOQL query for the data to export',
   *   id: "<field name to use as the Id>"
   *   type: 'The type of the query',
   *   useBulk: true || false,
   *   mappings: [
   *     {
   *        "sourceColumn": "Id",
   *        "destColumn": "NU__ExternalID__c"
   *     },...
   *   ]
   * }
   * @return {array} queryObjects - Array of QueryObject isntances.
   */
  return function(queryObjectData) {
    return queryObjectData.map(function(datum) {
      if (datum.useBulk) { return new BulkQueryObject(datum); }
      if (datum.type && datum.id) { return new ExportQueryObject(datum); }
      return new QueryObject(datum);
    });
  };
};
