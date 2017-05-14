<?php
/*
Plugin Name: wp-cache.js
Plugin URI:  https://github.com/felixarntz/wp-cache-js
Description: A JavaScript-based cache solution for WordPress using the client's local storage or, as fallback, a simple variable storage.
Version:     0.1.0
Author:      Felix Arntz
Author URI:  https://leaves-and-love.net
License:     GNU General Public License v3
License URI: http://www.gnu.org/licenses/gpl-3.0.html
Text Domain: wp-cache-js
Tags:        javascript, library, cache
*/

defined( 'ABSPATH' ) || exit;

function wp_cache_js_register_script( $scripts ) {
	$suffix  = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
	$version = '0.1.0';

	$scripts->add( 'wp-cache', plugin_dir_url( __FILE__ ) . "build/js/wp-cache$suffix.js", array( 'underscore' ), $version, true );
	did_action( 'init' ) && $scripts->localize( 'wp-cache', 'wpCacheSettings', array(
		'siteId'      => get_current_blog_id(),
		'networkId'   => get_current_network_id(),
		'isMultisite' => is_multisite(),
		'i18n'        => array(
			'noImplementationSet' => __( 'No cache implementation set.', 'wp-cache-js' ),
		),
	) );
}
add_action( 'wp_default_scripts', 'wp_cache_js_register_script', 11, 1 );
