/**
 * Created by zhuman on 2017/11/16.
 */
module.exports = function (grunt) {
    var spritestamp = grunt.template.today('yymmddHHMMss');

    // Project configuration
    grunt.initConfig({
        'pkg': grunt.file.readJSON('package.json'),
        "sass": {
            options: {
                style: 'compressed'
            },
            dist: {
                expand: true,
                cwd: 'css',
                src: ['**/*.scss'],
                dest: 'css',
                ext: '.css'
            },
            watch: {}
        },
        'cssmin': {
            options: {
                sourceMap: false
            },
            components: {
                src: ['css/components/*.css', '!css/components/*.min.css'],
                dest: 'css/components/comp.min.css'
            }
        },
        'sprite': {
            'ui-icon': {
                src: 'images/sprite/**/*.png',
                dest: 'images/sprite.'+spritestamp+'.png',
                destCss: 'css/common/_sprite.scss',
                imgPath: '/app/static/images/sprite.'+spritestamp+'.png',
                algorithm: 'binary-tree', //op-down/left-right/diagonal/alt-diagonal/binary-tree
                cssFormat: 'scss',
                cssVarMap: function (sprite) {
                    sprite.name = sprite.name;
                }
            }
        },
        'uglify': {
            options: {
                mangle: false,
                sourceMap: true,
                output: {
                    comments: false
                }
            },
            dist: {
                expand: true,
                cwd: 'js',
                src: ['**/*.js', '!**/*.min.js' , '!app.js' , '!electron-preload.js'],
                dest: 'js',
                ext: '.min.js'
            },
            watch: {}
        },
        'concat': {
            options: {
                separator: '\n\n',
                stripBanners: true,
                sourceMap: true
            },
            dist: {
                src: [
                    'js/base/electron-preload.min.js',   //electron解决冲突用的
                    'js/base/jquery.min.js',
                    'js/base/jquery-cookie.min.js',
                    'js/base/jquery-pjax.min.js',
                    'js/base/require.min.js',
                    'js/base/expand.min.js'
                ],
                dest: 'js/base.min.js'
            },
            plugins: {
                src: 'js/jquery-plugins/*.min.js',
                dest: 'js/plugins.min.js'
            }
        },
        'watch': {
            options: {
                spawn: false
            },
            'sass': {
                files: '**/*.scss'
            },
            'alljs': {
                files: ['js/**/*.js', '!js/**/*.min.js']
            }
        },
        'htmlstamp': {
            options: {
                type: 'inline',
                src:'../WEB-INF/jsp/',
                dest:'../WEB-INF/jsp/',
                patten:'**/*.jsp',
                comboCss:['**/*.css' , '**/*.js']
            },
            suffix_time:{
                 //files: {'../WEB-INF/jsp/acccoupon/**.jsp':['../static/js/bootstrap.min.js']}
            }
        },
        'clean': {
            clean_sprite: {
                src: ['images/sprite.*png']
            }
        }
    });

    // 监听事件
    grunt.event.on('watch', function(action, filepath, target) {
        if(action=="changed" && target==="sass"){
            var sasspath=filepath,
                csspath=filepath.replace('.scss','')+'.css';
            var filesObj={};
            filesObj[csspath]=sasspath;
            grunt.config("sass.watch.files",filesObj);
            if(filepath.indexOf('components') > -1) {
                grunt.task.run(['sass:watch', 'cssmin']);
            }else {
                grunt.task.run('sass:watch');
            }
        }else if(action=="changed" && target==="alljs") {
            var jspath=filepath,
                minjspath=filepath.replace('.js','')+'.min.js';
            var jsfilesObj={};
            jsfilesObj[minjspath]=jspath;
            grunt.config("uglify.watch.files",jsfilesObj);
            if(filepath.indexOf('base') > -1) {
                grunt.task.run(['uglify:watch', 'concat:dist']);
            }
            else if(filepath.indexOf('jquery-plugins') > -1) {
                grunt.task.run(['uglify:watch', 'concat:plugins']);
            }
            else {
                grunt.task.run('uglify:watch');
            }
        }
    });

    // 加载插件
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.loadNpmTasks('grunt-htmlstamp');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // 自定义任务
    grunt.registerTask('build-style', ['sass:dist', 'cssmin']);
    grunt.registerTask('build-sprite', ['clean:clean_sprite', 'sprite:ui-icon', 'sass:dist']);
    grunt.registerTask('build-js', ['uglify:dist', 'concat']);
    grunt.registerTask('watch-change', ['watch']);
    grunt.registerTask('build-jsp', ['htmlstamp']);
};