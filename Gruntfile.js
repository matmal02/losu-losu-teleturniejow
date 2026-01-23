module.exports = function(grunt) {
    require('dotenv').config();
    const sass = require('sass');

    const Debug = process.env.DEBUG === 'True' || process.env.NODE_ENV === 'development';
    console.log('DEBUG env var:', process.env.DEBUG);
    console.log('Debug flag:', Debug);

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
                removeCombined: false,
                findNestedDependencies: true,
                modules: [{
                    name: "scripts/router/app",
                    include: ["requireLib"]
                }],
                shim: {
                    palette: { exports: 'palette' },
                    underscore: { exports: '_' },
                    backbone: { deps: ['underscore', 'jquery'], exports: 'Backbone' },
                    chance: { exports: 'Chance' },
                    moment: { exports: 'moment' }
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
                        baseUrl: Debug ? '/' : '/losu-losu-teleturniejow/',
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
            },
            html404: {
                files: {
                    src: 'source/404.html',
                    dest: 'build/404.html'
                }
            },
            assets: {
                files: [
                    {
                        expand: true,
                        cwd: 'source/assets',
                        src: ['**/*'],
                        dest: 'build/assets'
                    }
                ]
            }
        },

        // QUnit tests
        qunit: {
            all: ['test/**/*.html']
        },

        // Development server
        connect: {
            options: {
                middleware: function(connect, options, middlewares) {
                    const rewrite = require('connect-modrewrite');
                    const serveStatic = require('serve-static');
                    
                    var middleware = [];

                    // 1. mod-rewrite behavior
                    var rules = [
                        '!\\.html|\\.js|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
                    ];
                    middleware.push(rewrite(rules));

                    // 2. original middleware behavior
                    var base = options.base;
                    if (!Array.isArray(base)) {
                        base = [base];
                    }
                    base.forEach(function(path) {
                        middleware.push(serveStatic(path));
                    });

                    return middleware;
                }
            },
            build: {
                options: {
                    hostname: 'localhost',
                    port: 7878,
                    base: 'build',
                    keepalive: true
                }
            }
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
    grunt.loadNpmTasks('grunt-contrib-connect');
    

    // Define tasks
    grunt.registerTask('lint', ['jshint:source']);
    grunt.registerTask('test', ['lint', 'jshint:test', 'qunit:all']);
    grunt.registerTask('build:development', ['lint', 'requirejs:development', 'template:compile', 'sass', 'copy:sounds', 'copy:html404', 'copy:assets']);
    grunt.registerTask('build:production', ['lint', 'requirejs:production', 'template:compile', 'sass', 'cssmin:all', 'copy:sounds', 'copy:html404', 'copy:assets']);
    grunt.registerTask('build', ['build:development']);
    
    // Conditionally register server task only for local development
    if (Debug) {
        grunt.registerTask('server', ['connect:build:keepalive']);
    }
    
    grunt.registerTask('default', ['build']);
};
