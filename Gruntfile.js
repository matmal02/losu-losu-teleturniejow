module.exports = function(grunt) {
    const sass = require('sass');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Lint JS
        jshint: {
            source: ['Gruntfile.js', 'source/scripts/{,*/}*.js', '!source/scripts/vendor/**'],
            test: ['test/**/*.js'],
            options: { esversion: 6 }
        },

        // RequireJS optimizer
        requirejs: {
            options: {
                appDir: "source",
                baseUrl: ".",
                dir: "build",
                removeCombined: true,
                modules: [{
                    name: "scripts/router/app",
                    include: "requireLib"
                }],
                shim: {
                    palette: { exports: 'palette' }
                },
                paths: {
                    requireLib: '../node_modules/requirejs/require',
                    jquery: '../node_modules/jquery/dist/jquery',
                    chance: '../node_modules/chance/chance',
                    moment: '../node_modules/moment/moment',
                    underscore: '../node_modules/underscore/underscore-umd-min',
                    backbone: '../node_modules/backbone/backbone',
                    palette: 'scripts/vendor/palette'
                },
                fileExclusionRegExp: /.*\.(?:tpl|s[ac]ss)/,
            },
            production: { options: { optimizeCss: "standard" } },
            development: { options: { optimize: "none" } }
        },

        // Template processing
        template: {
            compile: {
                options: {
                    data: {
                        appTitle: 'Losu losu',
                        baseUrl: '/losu-losu-teleturniejow/',
                        initialRoute: 'wheel/sheet:losulosu'
                    }
                },
                files: { 'build/index.html': ['source/index.html.tpl'] }
            }
        },

        // SCSS compilation
        sass: {
            options: { implementation: sass, sourceMap: true },
            dist: { files: { 'build/style/style.css': 'source/style/style.scss' } }
        },

        // CSS minification
        cssmin: {
            all: {
                files: [{
                    expand: true,
                    cwd: 'build/style',
                    src: ['*.css'],
                    dest: 'build/style',
                    ext: '.css'
                }]
            }
        },

        copy: {
            sounds: {
                files: [
                    {
                        expand: true,
                        cwd: 'source/sounds',
                        src: ['**/*'],
                        dest: 'build/sounds'
                    }
                ]
            }
        },

        // QUnit tests
        qunit: {
            all: ['test/**/*.html']
        }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Define tasks
    grunt.registerTask('lint', ['jshint:source']);
    grunt.registerTask('test', ['lint', 'jshint:test', 'qunit:all']);
    grunt.registerTask('build:development', ['lint', 'requirejs:development', 'template:compile', 'sass', 'copy:sounds']);
    grunt.registerTask('build:production', ['lint', 'requirejs:production', 'template:compile', 'sass', 'cssmin:all', 'copy:sounds']);
    grunt.registerTask('build', ['build:development']);
    grunt.registerTask('default', ['build']);
};
