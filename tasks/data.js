var containerFactory = require('../src/container-config');
/**
 * Task definitions for the data/cleanData tasks.
 * @param {object} grunt - reference to the grunt configuration object.
 */
module.exports = function(grunt) {

  var constants = grunt.config.get('nimbleforce');
  var container = containerFactory({
    username: constants.username,
    password: constants.password,
    url: constants.sfUrl,
    nuClassNamespace: constants.nuClassNamespace,
    nuObjectNamespace: constants.nuObjectNamespace,
    ncObjectNamespace: constants.ncObjectNamespace
  });
  var seq = container.get('promise').seq;
  var dataFileService = container.get('data-file-service');
  var namespaceJSON = container.get('namespace-service');

  var handleError = function (err) {
    grunt.fail.fatal(err);
  };

  grunt.registerTask('data', 'Pass the data file to be synced to the SF org.', function(path) {
    if (arguments.length === 0) {
      handleError(this.name + " Usage: data:path/to/data/file.json");
    }
    var done = this.async();

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

  grunt.registerTask('cleanData', 'Pass the data file for cleaning the SF org.', function(path) {
    if (arguments.length === 0) {
      handleError(this.name + " Usage: cleanData:path/to/data/file.json");
    }
    var done = this.async();

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
      dataFileService.cleanData(data.cleaners).then(function () {
        done();
      }, handleError);
    }
  });
};
