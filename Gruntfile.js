'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    },
    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    nimbleforce: {
      username: '<username>',
      password: '<password>',
      sfUrl: 'https://login.salesforce.com',
      namespaces: {},
      useBulkAPI: true,
      standardObjectWhitelist: [
        'Account',
        'Contact'
      ]
    },
    jscs: {
      src: [
        'index.js',
        'test/**/*.js',
        'src/**/*.js',
        'tasks/*.js'
      ],
      gruntfile: [
        'Gruntfile.js'
      ],
      options: {
        config: '.jscsrc'
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jscs');

  // By default, lint and run all tests.
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', 'mochaTest');
};
