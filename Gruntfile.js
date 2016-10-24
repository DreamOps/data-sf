'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        'index.js',
        'src/*.js',
        'src/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
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
      username: 'kzn-210@nu.dev',
      password: 'Honor210',
      sfUrl: 'https://login.salesforce.com',
      nuClassNamespace: 'NU.',
      nuObjectNamespace: 'NU__',
      ncObjectNamespace: 'NC__'
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // By default, lint and run all tests.
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', ['jshint', 'test']);

};
