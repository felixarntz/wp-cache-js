/* ---- THE FOLLOWING CONFIG SHOULD BE EDITED ---- */

var pkg = require( './package.json' );

function parseKeywords( keywords ) {
	// These keywords are useful for Packagist/NPM/Bower, but not for the WordPress plugin repository.
	var disallowed = [ 'wordpress', 'plugin' ];

	var k = keywords;
	for ( var i in disallowed ) {
		var index = k.indexOf( disallowed[ i ] );
		if ( -1 < index ) {
			k.splice( index, 1 );
		}
	}

	return k;
}

var keywords = parseKeywords( pkg.keywords );

var config = {
	pluginSlug: 'wp-cache-js',
	pluginName: 'wp-cache.js',
	pluginURI: pkg.homepage,
	author: pkg.author.name,
	authorURI: pkg.author.url,
	description: pkg.description,
	version: pkg.version,
	license: 'GNU General Public License v3',
	licenseURI: 'http://www.gnu.org/licenses/gpl-3.0.html',
	tags: keywords.join( ', ' ),
	contributors: [ 'flixos90' ].join( ', ' ),
	donateLink: false,
	minRequired: '4.6',
	testedUpTo: '4.6',
	translateURI: 'https://translate.wordpress.org/projects/wp-plugins/wp-cache-js',
	network: false
};

/* ---- DO NOT EDIT BELOW THIS LINE ---- */

// WP plugin header for main plugin file
var pluginheader = 	'Plugin Name: ' + config.pluginName + '\n' +
					'Plugin URI:  ' + config.pluginURI + '\n' +
					'Description: ' + config.description + '\n' +
					'Version:     ' + config.version + '\n' +
					'Author:      ' + config.author + '\n' +
					'Author URI:  ' + config.authorURI + '\n' +
					'License:     ' + config.license + '\n' +
					'License URI: ' + config.licenseURI + '\n' +
					'Text Domain: ' + config.pluginSlug + '\n' +
					( config.network ? 'Network:     true' + '\n' : '' ) +
					'Tags:        ' + config.tags;

// WP plugin header for readme.txt
var readmeheader =	'Plugin Name:       ' + config.pluginName + '\n' +
					'Plugin URI:        ' + config.pluginURI + '\n' +
					'Author:            ' + config.author + '\n' +
					'Author URI:        ' + config.authorURI + '\n' +
					'Contributors:      ' + config.contributors + '\n' +
					( config.donateLink ? 'Donate link:       ' + config.donateLink + '\n' : '' ) +
					'Requires at least: ' + config.minRequired + '\n' +
					'Tested up to:      ' + config.testedUpTo + '\n' +
					'Stable tag:        ' + config.version + '\n' +
					'Version:           ' + config.version + '\n' +
					'License:           ' + config.license + '\n' +
					'License URI:       ' + config.licenseURI + '\n' +
					'Tags:              ' + config.tags;


/* ---- REQUIRED DEPENDENCIES ---- */

var gulp = require( 'gulp' );

var jscs = require( 'gulp-jscs' );
var jshint = require( 'gulp-jshint' );
var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var rename = require( 'gulp-rename' );
var replace = require( 'gulp-replace' );

var paths = {
	php: {
		files: [ './*.php', './src/**/*.php', './templates/**/*.php' ]
	},
	js: {
		files: [ './js/**/*.js' ],
		src: './js/',
		dst: './build/js/'
	}
};

/* ---- MAIN TASKS ---- */

// general task (compile JavaScript)
gulp.task( 'default', [ 'js' ]);

// watch JavaScript files
gulp.task( 'watch', function() {
	gulp.watch( paths.js.files, [ 'js' ]);
});

// build the plugin
gulp.task( 'build', [ 'readme-replace' ], function() {
	gulp.start( 'header-replace' );
	gulp.start( 'default' );
});

/* ---- SUB TASKS ---- */

// compile JavaScript
gulp.task( 'js', function( done ) {
	gulp.src( paths.js.files )
		.pipe( jscs({
			fix: false
		}) )
		.pipe( jshint({
			lookup: true
		}) )
		.pipe( concat( 'wp-cache.js' ) )
		.pipe( gulp.dest( paths.js.dst ) )
		.pipe( uglify() )
		.pipe( rename({
			extname: '.min.js'
		}) )
		.pipe( gulp.dest( paths.js.dst ) )
		.on( 'end', done );
});

// replace the plugin header in the main plugin file
gulp.task( 'header-replace', function( done ) {
	gulp.src( './' + config.pluginSlug + '.php' )
		.pipe( replace( /((?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:\/\/.*))/, '/*\n' + pluginheader + '\n*/' ) )
		.pipe( gulp.dest( './' ) )
		.on( 'end', done );
});

// replace the plugin header in readme.txt
gulp.task( 'readme-replace', function( done ) {
	gulp.src( './readme.txt' )
		.pipe( replace( /\=\=\= (.+) \=\=\=([\s\S]+)\=\= Description \=\=/m, '=== ' + config.pluginName + ' ===\n\n' + readmeheader + '\n\n' + config.description + '\n\n== Description ==' ) )
		.pipe( gulp.dest( './' ) )
		.on( 'end', done );
});
