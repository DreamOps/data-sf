var SOAP = require('../../node_modules/jsforce/lib/soap');

/**
 * Factory function for the jsforce-partner-service.
 */
module.exports = function() {

    var PartnerService = function(conn) {
        this._conn = conn;
    };

    PartnerService.prototype._invoke = function(method, message, callback) {
        var soapEndpoint = new SOAP(this._conn, {
            xmlns: 'urn:partner.soap.sforce.com',
            endpointUrl: this._conn.instanceUrl + '/services/Soap/u/' + this._conn.version
        });
        return soapEndpoint.invoke(method, message).then(function(res) {
            return res.result;
        }).thenCall(callback);
    };

    /**
     * Retrieves describe for multiple sobjects
     *
     * @param {array} sObjectTypes - Array of sObject names to retrieve describe for.
     * @param {function} callback - Optional callback to which the resulting array of sObject describe is passed.
     * @return {object} Promise that resolves to an array of sObject describe.
     */
    PartnerService.prototype.describeSObjects = function(sObjectTypes, callback) {
        return this._invoke('describeSObjects', {sObjectType: sObjectTypes});
    };

    /**
     * Creates a partner service for the connection.
     *
     * @param {object} conn - JSforce connection
     */
    function create(conn) {
        return new PartnerService(conn);
    }

    return {
        create: create
    };
};
