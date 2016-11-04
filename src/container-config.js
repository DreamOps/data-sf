/**
 * All the components and dependencies are required and registered in an app container.
 * The kontainer-di simple app container injects the dependencies of each component
 * through a factory function which is the module.export of each service file.
 * When a component is requested from this container it calls the factory function with
 * the defined dependencies and returns the result.
 */
var container = require('kontainer-di');
var jsforce = require('jsforce');
var promise = require('promised-io/promise');
var util = require('util');
var connectionService = require('./services/connection-service');
var queryService = require('./services/query-service');
var apexService = require('./services/apex-service');
var environmentService = require('./services/environment-service');
var recordService = require('./services/record-service');
var communityUserService = require('./services/community-user-service');
var dataFileService = require('./services/data-file-service');
var namespaceService = require('./services/namespace-service');
var bulkRecordService = require('./services/bulk-record-service');

/**
 * Decided to make this container a factory function as well,
 * this way the config could be passed into the container instead
 * of required as a file here.
 *
 * @param {object} config - Object of config properties.
 *   {
 *     username: 'salesforce username',
 *     password: 'salesforce password',
 *     url: 'https://login.salesforce.com' or 'https://login.salesforce.com',
 *     //Namespace properties will be used to replace the default namespaces
 *     nuClassNamespace: 'NU.',
 *     nuObjectNamespace: 'NU__',
 *     ncObjectNamespace: 'NC__',
 *     useBulkAPI: true | false
 *   }
 * @return {object} Container
 */
module.exports = function(config) {
  container.register('config', [], function() {
    return config;
  });
  container.register('jsforce', [], function() {
    return jsforce;
  });
  container.register('promise', [], function() {
    return promise;
  });
  container.register('util', [], function() {
    return util;
  });
  container.register('logger', [], function() {
    return function(logMe) {
      console.log(logMe);
    };
  });
  container.register('namespace-service', ['config'], namespaceService);
  container.register('connection', ['jsforce', 'promise', 'config'], connectionService);
  container.register('query-service', ['connection', 'promise'], queryService);
  container.register('apex-service', ['connection', 'promise', 'util', 'logger'], apexService);
  container.register('environment-service', ['query-service', 'promise'], environmentService);
  container.register('record-service', ['connection', 'promise', 'logger'], recordService);
  container.register('bulk-record-service', ['connection', 'promise', 'logger'], bulkRecordService);
  container.register('community-user-service',
      ['query-service', 'record-service', 'promise', 'logger'],
      communityUserService);
  if (config.useBulkAPI) {
    container.register('data-file-service',
        ['environment-service', 'bulk-record-service', 'apex-service', 'promise'],
        dataFileService);
  } else {
    container.register('data-file-service',
        ['environment-service', 'record-service', 'apex-service', 'promise'],
        dataFileService);
  }
  return container;
};
