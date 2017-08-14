'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch'); //Run predefined tasks whenever watched file patterns are added, changed or deleted
    grunt.loadNpmTasks('grunt-contrib-clean'); //Clean files and folders
    grunt.loadNpmTasks('grunt-contrib-copy'); //Copy files and folders
    grunt.loadNpmTasks('grunt-contrib-concat'); //Concatenate files
    grunt.loadNpmTasks('grunt-mkdir'); //Create directories with Grunt
    grunt.loadNpmTasks('grunt-remove'); //Remove directory and files

    grunt.loadNpmTasks('grunt-usemin'); //Replaces references to non-optimized scripts or stylesheets into a set of HTML
    grunt.loadNpmTasks('grunt-ng-annotate'); //AngularJS dependency injection annotations
    grunt.loadNpmTasks('grunt-contrib-uglify'); //Minify files with UglifyJS
    grunt.loadNpmTasks('grunt-contrib-cssmin'); //Minify CSS
    grunt.loadNpmTasks('grunt-string-replace'); //Replaces strings on files by using string or regex patterns

    grunt.loadNpmTasks('grunt-notify'); //Automatic desktop notifications for Grunt errors and warnings
    grunt.loadNpmTasks('grunt-cache-breaker'); //Cache-breaker, appends a timestamp or md5 hash to any urls
    grunt.loadNpmTasks('grunt-angular-templates'); //Concatenate & register your AngularJS templates in the $templateCache

    var pkgJson = require('./package.json');
    var appVersion = pkgJson.version;

    grunt.initConfig({
        clean: {
            build: ['dist', '.tmp']
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'frontend',
                        src: [
                            'common/images/**',
                            '**/**/*.html'
                        ],
                        dest: 'dist'
                    },
                    {
                        expand: true,
                        cwd: 'frontend',
                        src: [
                            '*.html'
                        ],
                        dest: 'dist'
                    },
                    {
                        expand: true,
                        cwd: 'frontend',
                        flatten: true,
                        src: 'bower_components/bootstrap/dist/fonts/*',
                        dest: 'dist/fonts'
                    },
                    {
                        expand: true,
                        cwd: 'frontend',
                        flatten: true,
                        src: [
                            'bower_components/angular-ui-grid/*.woff',
                            'bower_components/angular-ui-grid/*.ttf'],
                        dest: 'dist/styles'
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist',
                        src: '**',
                        dest: 'frontend'
                    }
                ]
            }
        },

        concat: {
            styles: {
                files: {
                    'dist/styles/vendors.css': [
                        'frontend/bower_components/angular-ui-grid/ui-grid.min.css',
                        'frontend/bower_components/angular-ui-notification/dist/angular-ui-notification.min.css',
                        'frontend/bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'frontend/bower_components/bootstrap-daterangepicker/daterangepicker-bs3.css',
                        'frontend/bower_components/ui-select/dist/select.min.css',
                        'frontend/bower_components/intro.js/minified/introjs.min.css'
                    ],
                    'dist/styles/styles.css': [
                        'frontend/common/sass/styles.css',
                        'frontend/common/sass/bootstrap-mifort.css',

                        'frontend/components/tabs/tabs.css',
                        'frontend/components/timesheetIntro/timesheetIntro.css',
                        'frontend/company/company.css',
                        'frontend/login/login.css',
                        'frontend/projects/projects.css',
                        'frontend/timesheet/timesheet.css',
                        'frontend/calendar/calendar.css',
                        'frontend/report/report.css',
                        'frontend/employees/employees.css',
                        'frontend/employees/employeesReport.css'
                    ],
                    'dist/styles/print.css': [
                        'frontend/common/sass/print.css'
                    ]
                },
                options: {
                    process: function (src) {
                        return src.replace(/(?:(?:(?:\.\.\/)+common\/)|(?:(?:\.\.\/)*))images\//g, '../common/images/');
                    }
                }
            },
            scripts: {
                src: [
                    'frontend/app.js',
                    'frontend/components/tabs/bootstrapTabs.js',
                    'frontend/components/projectSummary/projectSummary.js',
                    'frontend/components/tableCell/tableCell.js',
                    'frontend/components/projectRow/projectRow.js',
                    'frontend/components/preferences/preferences.js',
                    'frontend/components/preferences/preferencesService.js',
                    'frontend/components/customDay/customDay.js',
                    'frontend/components/filters/propsFilter.js',
                    'frontend/components/filters/toDateFilter.js',
                    'frontend/components/filters/longTextFilter.js',
                    'frontend/components/filters/fixedFilter.js',
                    'frontend/components/dropdownFilter/dropdownFilter.js',
                    'frontend/components/dropdownFilterPdf/dropdownFilterPdf.js',
                    'frontend/components/reportDatePicker/reportDatePicker.js',
                    'frontend/components/timesheetIntro/timesheetIntro.js',
                    'frontend/components/cuttedComment/cuttedComment.js',
                    'frontend/components/timeMask/timeMask.js',
                    'frontend/components/timesheetComment/timesheetComment.js',
                    'frontend/login/loginController.js',
                    'frontend/login/loginService.js',
                    'frontend/company/companyController.js',
                    'frontend/company/confirmDeleteModal/confirmDeleteModal.js',
                    'frontend/company/companyService.js',
                    'frontend/projects/projectsController.js',
                    'frontend/projects/projectsService.js',
                    'frontend/timesheet/timesheetController.js',
                    'frontend/timesheet/timesheetService.js',
                    'frontend/services/projectSummaryService.js',
                    'frontend/calendar/calendarController.js',
                    'frontend/calendar/calendarService.js',
                    'frontend/report/reportController.js',
                    'frontend/report/reportService.js',
                    'frontend/employees/employeesController.js',
                    'frontend/employees/employeesService.js',
                    'frontend/employees/confirmDeleteModal/confirmDeleteModal.js',
                    'frontend/employees/employeesReportController.js',
                    'frontend/employees/employeesReportService.js'
                ],
                dest: 'dist/scripts/scripts.js'
            },
            vendors: {
                src: [
                    'frontend/bower_components/jquery/dist/jquery.min.js',
                    'frontend/bower_components/angular/angular.min.js',
                    'frontend/bower_components/angular-route/angular-route.min.js',
                    'frontend/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                    'frontend/bower_components/underscore/underscore-min.js',
                    'frontend/bower_components/moment/min/moment.min.js',
                    'frontend/bower_components/angular-moment/angular-moment.min.js',
                    'frontend/bower_components/angular-cookies/angular-cookies.min.js',
                    'frontend/bower_components/angular-ui-grid/ui-grid.min.js',
                    'frontend/bower_components/angular-click-outside/clickoutside.directive.js',
                    'frontend/bower_components/bootstrap-daterangepicker/daterangepicker.js',
                    'frontend/bower_components/ng-bs-daterangepicker/dist/ng-bs-daterangepicker.min.js',
                    'frontend/bower_components/angular-ui-notification/dist/angular-ui-notification.min.js',
                    'frontend/bower_components/ui-select/dist/select.min.js',
                    'frontend/bower_components/angular-sanitize/angular-sanitize.min.js',
                    'frontend/bower_components/intro.js/minified/intro.min.js',
                    'frontend/bower_components/angular-intro.js/build/angular-intro.min.js',
                    'frontend/bower_components/angular-filter/dist/angular-filter.min.js'
                ],
                dest: 'dist/scripts/vendors.js'
            }
        },

        "string-replace": {
            inline: {
                files: {
                    'dist/': 'dist/scripts/scripts.js'
                },
                options: {
                    replacements: [
                        {
                            pattern: "'appVersion', 'devVersion'",
                            replacement: "'appVersion', '" + appVersion + "'"
                        }
                    ]
                }
            }
        },

        usemin: {
            html: ['dist/index.html']
        },

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'dist/scripts/scripts.js': ['dist/scripts/scripts.js'],
                    'dist/scripts/scripts.min.js': ['dist/scripts/scripts.min.js'],
                    'dist/scripts/vendors.js': ['dist/scripts/vendors.js'],
                    'dist/scripts/vendors.min.js': ['dist/scripts/vendors.min.js']
                }
            }
        },

        //for later usage(caching html templates)
        ngtemplates: {
            app: {
                src: [
                    'dist/**/*.html',
                    '!dist/frontend/bower_components/**'
                ],
                dest: 'dist/scripts/templates.js',
                options: {
                    url: function (url) {
                        url = url.slice(url.indexOf('dist'));

                        return url.replace('dist/', '');
                    },
                    module: 'mifortTimesheet',
                    htmlmin: {
                        collapseBooleanAttributes: false, // Otherwise 'sortable' attribute values are deleted
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: false, // Because some directives look like empty attributes
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            }
        },

        uglify: {
            options: {
                mangle: false,
                sourceMap: true
            },
            build: {
                files: {
                    'dist/scripts/scripts.min.js': ['dist/scripts/scripts.js'],
                    'dist/scripts/vendors.min.js': ['dist/scripts/vendors.js']
                }
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: 0
            },
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/styles/',
                        src: ['*.css', '!*.min.css'],
                        dest: 'dist/styles/',
                        ext: '.min.css'
                    }
                ]
            }
        },

        notify: {
            options: {
                enabled: true,
                title: 'Mifort'
            }
        },

        cachebreaker: {
            scripts: {
                options: {
                    match: ['scripts.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/scripts/scripts.min.js'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            vendorsscripts: {
                options: {
                    match: ['vendors.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/scripts/vendors.min.js'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            vendors: {
                options: {
                    match: ['vendors.min.css'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/styles/vendors.min.css'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            styles: {
                options: {
                    match: ['styles.min.css'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/styles/styles.min.css'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            }
        },

        remove: {
            // Removes the frontend directory. Careful. Used to replace app with dist in official build.
            frontend: {
                dirList: ['frontend']
            },
            dist: {
                dirList: ['dist']
            }
        },

        mkdir: {
            frontend: {
                options: {
                    create: ['frontend']
                }
            }
        }
    });

    var tasks = [];
    if (process.env.GRUNT_ENV === 'production') {
        tasks = [
            'clean:build',
            'copy:build',
            'concat',
            'string-replace',
            'ngAnnotate',
            'usemin',
            //'ngtemplates',
            'uglify',
            'cssmin',
            'notify',
            'cachebreaker',

            'remove:frontend',
            'mkdir:frontend',
            'copy:dist',
            'remove:dist'
        ];
    }

    grunt.registerTask('build', tasks);
};
