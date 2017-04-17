/**
 * Factory function for the jsforce-partner-service.
 *
 * @param {object} SOAP - jsforce SOAP lib.
 * @param {function} login - login-service
 * @return {object} jsforce-partner-service
 */
module.exports = function(SOAP, login) {

    var _invoke = function(method, message, callback) {
      return login().then(function(conn) {
        var soapEndpoint = new SOAP(conn, {
            xmlns: 'urn:partner.soap.sforce.com',
            endpointUrl: conn.instanceUrl + '/services/Soap/u/' + conn.version
        });
        return soapEndpoint.invoke(method, message).then(function(res) {
            return res.result;
        });
      });
    };

    /**
     * Retrieves describe for multiple sobjects
     *
     * @param {array} sObjectTypes - Array of sObject names to retrieve describe for.
     * @param {function} callback - Optional callback to which the resulting array of sObject describe is passed.
     * @return {object} Promise that resolves to an array of sObject describe.
     */
    var describeSObjects = function(sObjectTypes, callback) {
        return _invoke('describeSObjects', {sObjectType: sObjectTypes});
    };

    return {
        describeSObjects: describeSObjects
    };
};
