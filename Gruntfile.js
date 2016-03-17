module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    clean: {
      options: {
        force: true,
      },
      charts: {
        src: [
            'build/*',
        ],
      },
    },
    
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      charts: {
        files: { 
          'build/main.min.js': ['build/main.js'],
        },
      }
    },
    
    browserify: {
      charts: {
        files: {'build/main.js': ['src/main.js']},
      }, 
    },
    
    copy: {
      options: {
        mode: '0644',
      },
      'local-charts': {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['build/main*.js', 'assets/style.css'],
            dest: grunt.option('deploy_path'),
          },
        ],
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('build', ['browserify', 'uglify']);

  grunt.registerTask('deploy-local', ['copy:local-charts']);
  
  grunt.registerTask('default', 'Greet', function () {
    console.log('Hello Grunt!');
  });

};
