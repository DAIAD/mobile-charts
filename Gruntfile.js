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
  
    jshint: {
      options: {
      },
      charts: {
      src: ['src/js/**.js'],
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      "charts": {
        files: { 
          'build/daiad-charts.min.js': ['build/daiad-charts.js'],
        },
      },
      "vendor-flot-orderBars": {
        files: {
          'build/flot-orderBars.min.js': ['build/flot-orderBars.js'],
        }
      },
      "vendor-moment": {
        files: {
          'build/moment-localized.min.js': ['build/moment-localized.js'],
        }
      }
    },
  
    browserify: {
      options: {
        /*moved to package.json*/
      },
      "charts": {
        options: {
          external: ['jquery', 'moment'],
        },
        files: {
          'build/daiad-charts.js': ['src/js/main.js'],
          'build/example.js': ['src/js/example.js']
        },
      },
      "vendor-flot-orderBars": {
        files: {
          'build/flot-orderBars.js': ['vendor/flot-orderBars/js/jquery.flot.orderBars.js'],
        }
      },
      "vendor-moment": {
        options: {
          require: ['moment'],
        },
        files: {
          'build/moment-localized.js': ['vendor/moment-localized.js'],
        },
      },
    },
  
    copy: {
      options: {
        mode: '0644',
      },
      "charts": {
        options: {
          processContent: function (data, src) {
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
            src: 'daiad-charts*.js',
            dest: prefix,
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'build/',
            src: 'moment*.js',
            dest: prefix,
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'build/',
            src: 'flot-orderBars*.js',
            dest: prefix,
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'src/html/',
            src: '*.html',
            dest: prefix,
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'assets/',
            src: '**',
            dest: prefix,
          },
          {
            expand: true,
            filter: 'isFile',
            cwd: 'build/',
            src: 'example.js',
            dest: prefix,
          },
        ],
      }
    },

    watch: {
      charts: {
        files: ['src/js/**.js', 'src/html/**.html', 'assets/style.css'],
        tasks: ['build', 'deploy'],
      },
    },
  
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('build', ['browserify', 'uglify']);

  grunt.registerTask('deploy', ['copy:charts']);
  
  grunt.registerTask('default', 'Greet', function () {
  console.log('Hello from ' + grunt.template.process('<%=  pkg.name %>'))
  console.log('Hello from ' + grunt.config.get('pkg').name)
  });
};
