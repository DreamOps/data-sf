var seq = require('promised-io/promise').seq;
var nimbleforce = require('../index');
module.exports = function(grunt) {

  var constants = grunt.config.get('nimbleforce');

  var handleError = function (err) {
    grunt.fail.fatal(err);
  };
  var getNimbleForce = function () {
    return new nimbleforce(constants.username, constants.password, constants.sfUrl);
  };

  grunt.registerTask('data', 'Pass the data file to be synced to the SF org.', function(path) {
    var nimbleConnection = getNimbleForce();
    if (arguments.length === 0) {
      handleError(this.name + " Usage: data:path/to/data/file.json");
    }
    var done = this.async();
    var rawData = grunt.file.readJSON(path);

    var namespacedString = JSON.stringify(rawData)
      .split('NU__').join(constants.nuObjectNamespace)
      .split('NU.').join(constants.nuClassNamespace)
      .split('NC__').join(constants.ncNamespace);
    var data = JSON.parse(namespacedString);

    if (data.manifest) {
      //trim the manifest file from the path
      path = path.split('/');
      path.pop();
      path = path.join('/');

      var fnArray = data.order.map(function(filename) {
        var pathToFile = path + '/' + filename;
        var thisData = grunt.file.readJSON(pathToFile);
        return function() {
          console.log(filename);
          return nimbleConnection.processData(thisData);
        };
      });
      seq(fnArray).then(function(results) {
        done();
      }, handleError);
    } else {
      nimbleConnection.processData(data).then(function(results) {
        done();
      }, handleError);
    }
  });

  grunt.registerTask('cleanData', 'Pass the data file for cleaning the SF org.', function(path) {
    var nimbleConnection = getNimbleForce();
    if (arguments.length === 0) {
      handleError(this.name + " Usage: cleanData:path/to/data/file.json");
    }
    var done = this.async();
    var rawData = grunt.file.readJSON(path);

    var namespacedString = JSON.stringify(rawData)
      .split('NU__').join(constants.nuObjectNamespace)
      .split('NU.').join(constants.nuClassNamespace)
      .split('NC__').join(constants.ncNamespace);
    var data = JSON.parse(namespacedString);

    if (data.manifest) {
      //trim the manifest file from the path
      path = path.split('/');
      path.pop();
      path = path.join('/');

      var reverseFilenames = data.order.reverse();
      var fnArray = reverseFilenames.map(function(filename) {
        var pathToFile = path + '/' + filename;
        var thisData = grunt.file.readJSON(pathToFile);
        return function() {
          console.log(filename);
          return nimbleConnection.cleanDataFor(thisData.cleaners);
        };
      });
      seq(fnArray).then(function(results) {
        done();
      }, handleError);
    } else {
      nimbleConnection.cleanDataFor(data.cleaners).then(function () {
        done();
      }, handleError);
    }
  });
};
