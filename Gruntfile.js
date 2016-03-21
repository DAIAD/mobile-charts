module.exports = function(grunt) {
  
  var prefix = grunt.option('prefix') || 'dist/';
  
  var re_js_file = /^([^.]*)([.]min)*[.]js$/
  
  var pkg = grunt.file.readJSON('package.json'); 

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    
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
        files: {'build/main.js': ['src/js/main.js']},
      },

    },
    
    copy: {
      options: {
        mode: '0644',
      },
      charts: {
        options: {
          processContent: function (data, src) {
            console.log(' **1* Pre-processing ' + src +' ...')
            return grunt.template.process(data)
          },
          processContentExclude: [
            'build/*.js',
            'build/*.min.js',
            'assets/*.css',
            'assets/fonts/**'
          ],
        },
        files: [
          {
            expand: true,
            filter: 'isFile',
            cwd: 'build/',
            src: 'main*.js',
            dest: prefix,
            rename: function (dest, src) {
                return dest + (pkg.name + src.substr('main'.length));
            },  
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'src/html/',
            src: '*.html',
            dest: prefix,
            options: {
                process: function (data, src) {
                    return 'Hello (processed) World!!'
                },
            }
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'assets/',
            src: '**',
            dest: prefix,
          },
        ],
      }
    },

    deploy: {
      options: {
        prefix: 'dist',
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('build', ['browserify', 'uglify']);

  grunt.registerTask('deploy', ['copy:charts']);
  
  grunt.registerTask('default', 'Greet', function () {
    console.log('Hello from ' + grunt.template.process('<%=  pkg.name %>'))
    console.log('Hello from ' + grunt.config.get('pkg').name)
  });
};
