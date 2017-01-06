var containerFactory = require('../src/container-config');
var readlineSync = require('readline-sync');
/**
 * Task definitions for the data/cleanData tasks.
 *
 * @param {object} grunt - reference to the grunt configuration object.
 */
module.exports = function(grunt) {

  var handleError = function(err) {
    grunt.fail.fatal(err);
  };

  var constants = grunt.config.get('nimbleforce');
  var getContainer = function() {
    var useBulkAPI = constants.useBulkAPI == undefined ? true : constants.useBulkAPI;
    return containerFactory({
      username: constants.username,
      password: constants.password,
      url: constants.sfUrl,
      nuClassNamespace: constants.nuClassNamespace,
      nuObjectNamespace: constants.nuObjectNamespace,
      ncObjectNamespace: constants.ncObjectNamespace,
      useBulkAPI: useBulkAPI
    });
  };

  grunt.registerTask('data', 'Pass the data file to be synced to the SF org.', function(path) {
    if (arguments.length === 0) {
      handleError(this.name + ' Usage: data:path/to/data/file.json');
    }
    var done = this.async();

    var container = getContainer();
    var seq = container.get('promise').seq;
    var dataFileService = container.get('data-file-service');
    var namespaceJSON = container.get('namespace-service');

    var data = grunt.file.readJSON(path);

    if (data.manifest) {
      //trim the manifest file from the path
      path = path.split('/');
      path.pop();
      path = path.join('/');

      var fnArray = data.order.map(function(filename) {
        var pathToFile = path + '/' + filename;
        var thisData = namespaceJSON(grunt.file.readJSON(pathToFile));
        return function() {
          console.log(filename);
          return dataFileService.processData(thisData);
        };
      });
      seq(fnArray).then(function(results) {
        done();
      }, handleError);
    } else {
      data = namespaceJSON(data);
      dataFileService.processData(data).then(function(results) {
        done();
      }, handleError);
    }
  });

  grunt.registerTask('export', 'Pass the queries file of data to export.', function(path, dest) {
    if (arguments.length < 2) {
      handleError(this.name + ' Usage: export:path/to/queries/file.json:path/to/destination/dir');
    }

    if (!grunt.file.exists(dest) || !grunt.file.isDir(dest)) {
      handleError('Destination must be an existing directory.');
    }
    var done = this.async();

    var container = getContainer();
    var exportService = container.get('export-service');
    var queryObjectFactory = container.get('query-object-factory');
    var namespaceJSON = container.get('namespace-service');
    var queries = queryObjectFactory(namespaceJSON(grunt.file.readJSON(path)));

    exportService.export(queries, dest).then(function() {
      done();
    }, function(err) {
      done(err);
    });
  });

  grunt.registerTask('cleanData', 'Pass the data file for cleaning the SF org.', function(path) {
    if (!readlineSync.keyInYN('username: ' + constants.username + ' Are you sure?')) {
      handleError('Aborting');
    }
    if (arguments.length === 0) {
      handleError(this.name + ' Usage: cleanData:path/to/data/file.json');
    }
    var done = this.async();

    var container = getContainer();
    var seq = container.get('promise').seq;
    var dataFileService = container.get('data-file-service');
    var namespaceJSON = container.get('namespace-service');

    var data = grunt.file.readJSON(path);

    if (data.manifest) {
      //trim the manifest file from the path
      path = path.split('/');
      path.pop();
      path = path.join('/');

      var reverseFilenames = data.order.reverse();
      var fnArray = reverseFilenames.map(function(filename) {
        var pathToFile = path + '/' + filename;
        var thisData = namespaceJSON(grunt.file.readJSON(pathToFile));
        return function() {
          console.log(filename);
          return dataFileService.cleanData(thisData.cleaners);
        };
      });
      seq(fnArray).then(function(results) {
        done();
      }, handleError);
    } else {
      data = namespaceJSON(data);
      dataFileService.cleanData(data.cleaners).then(function() {
        done();
      }, handleError);
    }
  });
};
