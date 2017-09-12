var containerFactory = require('../src/container-config');
var readlineSync = require('readline-sync');
var fs = require ('fs');
/**
 * Task definitions for the data/cleanData tasks.
 *
 * @param {object} grunt - reference to the grunt configuration object.
 */
module.exports = function(grunt) {
  var constants = grunt.config.get('nimbleforce');
  grunt.config('username', grunt.option('username') || constants.username);
  grunt.config('password', grunt.option('password') || constants.password);
  grunt.config('sfUrl', grunt.option('sfUrl') || constants.sfUrl);
  grunt.config('useBulkAPI', grunt.option('useBulkAPI') || constants.useBulkAPI);
  grunt.config('instanceUrl', grunt.option('instanceUrl'));
  grunt.config('jwt', grunt.option('jwt'));
  grunt.config('namespaces', grunt.option('namespaces') || constants.namespaces);
  grunt.config('standardObjectWhitelist', grunt.option('standardObjectWhitelist') || constants.standardObjectWhitelist);

  var handleError = function(err) {
    grunt.fail.fatal(err);
  };

  var getContainer = function() {
    try {
      var parsed = JSON.parse(grunt.config('namespaces'));
      grunt.config('namespaces', parsed);
    } catch (e) {
      //assuming it is already parsed
      grunt.config('namespaces', grunt.config('namespaces'));
    }

    if (grunt.option('znu')) {
      grunt.config('namespaces', {'NU__': 'znu__', 'NC__': '', 'NU.': 'znu.'});
    } else if (grunt.option('dev')) {
      grunt.config('namespaces', {'NU__': '', 'NC__': '', 'NU.': ''});
    } else if (grunt.option('packaged')) {
      grunt.config('namespaces', {'NU__': 'NU__', 'NC__': 'NC__', 'NU.': 'NU.'});
    }

    return containerFactory({
      username: grunt.config('username'),
      password: grunt.config('password'),
      url: grunt.config('sfUrl'),
      instanceUrl: grunt.config('instanceUrl'),
      jwt: grunt.config('jwt'),
      namespaces: grunt.config('namespaces'),
      useBulkAPI: grunt.config('useBulkAPI'),
      standardObjectWhitelist: grunt.config('standardObjectWhitelist')
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
        if(filename.toLowerCase().endsWith('.json')){
          var thisData = namespaceJSON(grunt.file.readJSON(pathToFile));
          return function() {
            console.log(filename);
            return dataFileService.processData(thisData);
          };
        } else if(filename.toLowerCase().endsWith('.js')) {
          var realPath = fs.realpathSync(pathToFile);
          return function() {
            console.log(filename);
            var thisFunction = require(realPath);
            return thisFunction(container);
          }
        }
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
    if (!grunt.option('forceClean') &&
      !readlineSync.keyInYN('username: ' + grunt.config('username') + ' Are you sure?')) {
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

  grunt.registerTask('mapping', 'Generates a mapping for an org.', function(path) {
    if (arguments.length < 1) {
      handleError(this.name + ' Usage: mapping:path/to/destination/file.json');
    }

    var done = this.async();
    var mappingService = getContainer().get('mapping-service');

    mappingService.map(path).then(function() {
      done();
    }, handleError);
  });

  grunt.registerTask('obfuscateEmails', 'Pass the directory for file to have emails obfuscated.', function(path) {
    if (arguments.length === 0) {
      handleError(this.name + ' Usage: obfuscateEmails:path/to/data/');
    }

    var container = getContainer();
    var seq = container.get('promise').seq;
    var dataFileService = container.get('data-file-service');

    var data = grunt.file.recurse(path, function(abspath, rootdir, subdir, filename) {
      var rawData = grunt.file.readJSON(abspath);
      var newRawData = dataFileService.obfuscateEmails(rawData);
      var fileData = JSON.stringify(newRawData, null, 2);
      grunt.file.write(abspath, fileData);
    });
  });
};
