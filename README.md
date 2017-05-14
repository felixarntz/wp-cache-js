# wp-cache.js

A JavaScript-based cache solution for WordPress using the client's local storage or, as fallback, a simple variable storage.

## Description

The script exposes a `wp.cache` object with the following methods:

* `add( key, data, group, expire )`
* `replace( key, data, group, expire )`
* `set( key, data, group, expire )`
* `get( key, group, force )`
* `remove( key, group )`
* `flush()`
* `incr( key, offset, group )`
* `decr( key, offset, group )`
* `switchToSite( siteId )`
* `switchToNetwork( networkId )`
* `addNetworkGroups( groups )`
* `addGlobalGroups( groups )`
* `addNonPersistentGroups( groups )`
* `init()`
* `close()`

## Installation

1. Upload the entire `wp-cache-js` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Enqueue the script by using `wp_enqueue_script( 'wp-cache' )` or by declaring it as a dependency to one of your scripts, such as `wp_enqueue_script( 'my-script', '/path/to/my/script.js', array( 'wp-cache' ) )`.

## FAQ

### How can I register my own cache implementation?

You can register your own cache implementation if you would like to add support for another type of cache to use in JavaScript, just like you can place a cache drop-in for WordPress server-side.

In order to do that, you need to create your own object which implements all of the methods mentioned in the Description section (except for `init()` and `close()` which can be optionally implemented), plus an additional `checkRequirements()` method that should return `true|false` depending on whether the client fulfills the requirements for this cache type.

You can then register your object using `wp.cache.registerImplementation( identifier, implementationObject, priority )` with `identifier` being a unique identifier for your implementation and `priority` being a numeric value to determine the priority in which to check for the implementation. The default `localStorage` implementation has a priority of 10 and the `variableStorage` implementation a priority of 100.
