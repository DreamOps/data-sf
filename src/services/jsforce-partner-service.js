/**
 * Factory function for the jsforce-partner-service.
 *
 * @param {object} SOAP - jsforce SOAP lib.
 * @param {function} login - login-service
 * @return {object} jsforce-partner-service
 */
module.exports = function(SOAP, login) {

    var _invoke = function(method, message, schema, callback) {
      return login().then(function(conn) {
        var soapEndpoint = new SOAP(conn, {
            xmlns: 'urn:partner.soap.sforce.com',
            endpointUrl: conn.instanceUrl + '/services/Soap/u/' + conn.version
        });
        if (schema) {
            schema = {result: schema};
        }
        return soapEndpoint.invoke(method, message, schema).then(function(res) {
            return res.result;
        });
      });
    };

    var schemas = {};

    schemas.UpsertResult = {
        created: 'boolean',
        errors: [],
        id: 'string',
        success: 'boolean'
    };

    /**
     * Retrieves describe for multiple sobjects
     *
     * @param {array} sObjectTypes - Array of sObject names to retrieve describe for.
     * @param {function} callback - Optional callback to which the resulting array of sObject describe is passed.
     * @return {object} Promise that resolves to an array of sObject describe.
     */
    var describeSObjects = function(sObjectTypes, callback) {
        return _invoke('describeSObjects', {sObjectType: sObjectTypes}, undefined, callback);
    };

    /**
     * Upserts multiple records
     *
     * @param {string} externalIDFieldName - The name of the external id field.
     * @param {array} sObjects - Array of records to upsert.
     * @param {function} callback - Optional callback to which the results are passed.
     * @return {object} Promise that resolves to an array of upsert results.
     */
    var upsert = function(externalIDFieldName, sObjects, callback) {
        var args = {externalIDFieldName: externalIDFieldName, sObjects: sObjects};
        return _invoke('upsert', args, [schemas.UpsertResult], callback);
    };

    return {
        describeSObjects: describeSObjects,
        upsert: upsert
    };
};
