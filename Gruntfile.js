module.exports = function(grunt) {
    require('dotenv').config();
    const sheet_id = process.env.SHEET_ID;
    const api_key = process.env.GOOGLE_API;

    const sass = require('sass');
    var rewrite = require('connect-modrewrite');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            source: ['Gruntfile.js', 'source/scripts/{,*/}*.js', '!source/scripts/vendor/**'],
            test: ['test/**/*.js'],
            options: {
                esversion: 6
            }
        },
        requirejs: {
            options: {
                appDir: "source",
                baseUrl: ".", // relaive to appDir
                dir: "build",
                removeCombined: true,
                modules: [{
                    name: "scripts/router/app",
                    include: "requireLib"
                }],
                shim: {
                    palette: {
                        exports: 'palette'
                    }
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
            production: {
                options: {
                    optimizeCss: "standard",
                }
            },
            development: {
                options: {
                    optimize: "none"
                }
            }
        },
        template: {
            options: {},
            compile: {
                options: {
                    data: {
                        appTitle: 'Wheel of Fortune',
                        baseUrl: '/',
                        initialRoute: `wheel/sheet:losulosu`
                    }
                },
                files: {
                    'build/index.html': ['source/index.html.tpl']
                }
            }
        },
        sass: {
            options: {
                implementation: sass,
                sourceMap: true
            },
            dist: {
                files: {
                    'build/style/style.css': 'source/style/style.scss'
                }
            }
        },
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
        connect: {
            options: {
                middleware: function(connect, options, middlewares) {

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
                        middleware.push(require('serve-static')(path));
                    });

                    return middleware;
                }
            },
            build: {
                options: {
                    hostname: 'localhost',
                    port: 7878,
                    base: 'build'
                }
            }
        },
        rsync: {
            options: {
                args: ["--verbose"],
                recursive: true
            },
            production: {
                options: {
                    src: "build/",
                    exclude: ["build.txt", ".DS_Store"],
                    dest: "/tmp/wheel-of-fortune",
                    host: "localhost",
                    deleteAll: true
                }
            }
        },
        qunit: {
            all: ['test/**/*.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-rsync');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('lint', ['jshint:source']);
    grunt.registerTask('test', ['lint', 'jshint:test', 'qunit:all']);
    grunt.registerTask('build:development', ['lint', 'requirejs:development', 'template:compile', 'sass']);
    grunt.registerTask('build:production', ['lint', 'requirejs:production', 'template:compile', 'sass', 'cssmin:all']);
    grunt.registerTask('build', ['build:development']);
    grunt.registerTask('deploy', ['build:production', 'rsync:production']);
    grunt.registerTask('server', ['connect:build:keepalive']);
    grunt.registerTask('build', ['build:development']);

    grunt.registerTask('default', ['build']);
};