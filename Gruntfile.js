module.exports = function (grunt) {

// Project configuration.
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    pluginName: 'naveratops',
    watch: {
        options: {
            livereload: true
        },
        css: {
            files: 'app/scss/*',
            tasks: ['sass']
        },
        js: {
            files: 'app/js/*',
            tasks: ['copy:demo']
        },
        html: {
            files: ['demo/*.html', 'demo/*.php']
        },
        images: {
            files: 'demo/imgs/*'
        }
    },
    sass: {
        dist: {
            files: {
                'demo/css/<%= pluginName %>.css': 'app/scss/demo.scss'
            }
        }
    },
    copy: {
        demo: {
            files: [
                {
                    expand: true,
                    cwd: 'app/js',
                    src: '**',
                    dest: 'demo/js/'
                }
            ]
        },
        dist: {
            files: [
                {
                    expand: true,
                    cwd: 'app/js',
                    src: '**',
                    dest: 'build/js/'
                }
            ]
        }
    },
    uglify: {
        dist: {
            files: {
                'build/js/<%= pluginName %>.min.js': ['app/js/<%= pluginName %>.js']
            }
        }
    },
    connect: {
        server: {
            options: {
                hostname: 'localhost',
                base: 'demo/',
                livereload: true
            }
        }
    }
});

grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-sass');
grunt.loadNpmTasks('grunt-contrib-connect');
grunt.loadNpmTasks('grunt-contrib-uglify');

grunt.registerTask('default', ['connect','watch']);
grunt.registerTask('demo', ['sass', 'copy:demo']);
grunt.registerTask('build', ['sass', 'copy:dist', 'uglify']);
};