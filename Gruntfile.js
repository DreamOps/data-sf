'use strict';

module.exports = function(grunt) {

  grunt.config('username', grunt.option('username') || 'kzn-46@nu.dev');
  grunt.config('password', grunt.option('password') || 'Honor1234');
  grunt.config('sfUrl', grunt.option('sfUrl') || 'https://login.salesforce.com');
  if (grunt.option('noNamespace')) {
    grunt.config('nuClassNamespace', '');
    grunt.config('nuObjectNamespace', '');
    grunt.config('ncObjectNamespace', '');
  } else {
    grunt.config('nuClassNamespace', grunt.option('nuClassNamespace') || 'NU.');
    grunt.config('nuObjectNamespace', grunt.option('nuObjectNamespace') || 'NU__');
    grunt.config('ncObjectNamespace', grunt.option('ncObjectNamespace') || 'NC__');
  }

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
      username: grunt.config('username'),
      password: grunt.config('password'),
      sfUrl: grunt.config('sfUrl'),
      nuClassNamespace: grunt.config('nuClassNamespace'),
      nuObjectNamespace: grunt.config('nuObjectNamespace'),
      ncObjectNamespace: grunt.config('ncObjectNamespace')
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
