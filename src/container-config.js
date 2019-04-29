/**
 * All the components and dependencies are required and registered in an app container.
 * The kontainer-di simple app container injects the dependencies of each component
 * through a factory function which is the module.export of each service file.
 * When a component is requested from this container it calls the factory function with
 * the defined dependencies and returns the result.
 */
var container = require('kontainer-di');
var jsforce = require('jsforce');
var fs = require('fs');
var util = require('util');
var lodash = require('lodash');
var connectionService = require('./services/connection-service');
var queryService = require('./services/query-service');
var apexService = require('./services/apex-service');
var environmentService = require('./services/environment-service');
var recordService = require('./services/record-service');
var communityUserService = require('./services/community-user-service');
var dataFileService = require('./services/data-file-service');
var namespaceService = require('./services/namespace-service');
var bulkRecordService = require('./services/bulk-record-service');
var exportService = require('./services/export-service');
var queryObjectFactory = require('./factories/query-object');
var bulkQueryService = require('./services/bulk-query-service');
// var jsforcePartnerService = require('./services/jsforce-partner-service.js');
var mappingService = require('./services/mapping-service.js');
// var SOAP = require('../node_modules/jsforce/lib/soap');

/**
 * Container is a factory function as well.
 * This way the config could be passed into the container instead
 * of required as a file here.
 *
 * @param {object} config - Object of config properties.
 *   {
 *     username: 'salesforce username',
 *     password: 'salesforce password',
 *     url: 'https://login.salesforce.com' || 'https://test.salesforce.com',
 *     //Namespaces object to replace namespaces
 *     namespaces: {
 *       'NU__': 'znu__',
 *       'NC__': '',
 *       'NU.': 'znu.'
 *     },
 *     useBulkAPI: true | false
 *   }
 * @return {object} Container
 */
module.exports = function(config) {
  container.reset();
  container.register('config', [], function() {
    return config;
  });
  container.register('jsforce', [], function() {
    return jsforce;
  });
  container.register('fs', [], function() {
    return fs;
  });
  container.register('util', [], function() {
    return util;
  });
  container.register('lodash', [], function() {
    return lodash;
  });
  // container.register('SOAP', [], function() {
  //   return SOAP;
  // });
  container.register('logger', [], function() {
    return function(logMe) {
      console.log(logMe);
    };
  });
  container.register('namespace-service', ['config'], namespaceService);
  container.register('connection', ['jsforce', 'config'], connectionService);
  container.register('query-service', ['connection'], queryService);
  container.register('bulk-query-service', ['connection'], bulkQueryService);
  container.register('query-object-factory', ['query-service', 'bulk-query-service'], queryObjectFactory);
  container.register('apex-service', ['connection', 'util', 'logger'], apexService);
  container.register('environment-service', ['query-object-factory'], environmentService);
  container.register('record-service', ['connection', 'logger', 'jsforce-partner-service', 'lodash'], recordService);
  container.register('bulk-record-service', ['connection', 'logger'], bulkRecordService);
  container.register('community-user-service',
      ['query-service', 'record-service', 'logger'],
      communityUserService);
  if (config.useBulkAPI) {
    container.register('data-file-service',
        ['environment-service', 'bulk-record-service', 'apex-service', 'fs'],
        dataFileService);
  } else {
    container.register('data-file-service',
        ['environment-service', 'record-service', 'apex-service', 'fs'],
        dataFileService);
  }
  container.register('export-service', ['connection', 'data-file-service'], exportService);
  // container.register('jsforce-partner-service', ['SOAP', 'connection'], jsforcePartnerService);
  // container.register('mapping-service', ['config', 'connection', 'jsforce-partner-service', 'lodash', 'fs'],
  //     mappingService);
  return container;
};
