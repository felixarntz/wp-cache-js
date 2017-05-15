( function( window, _ ) {
	'use strict';

	var implementations = [],
		currentImplementation,
		loggedError = false;

	window.wpCacheSettings = window.wpCacheSettings || {
		siteId: 1,
		networkId: 1,
		isMultisite: false,
		i18n: {
			noImplementationSet: 'No cache implementation set.'
		}
	};

	/**
	 * Sets the current implementation based on priority and whether requirements are met.
	 *
	 * @since 0.1.0
	 */
	function setCurrentImplementation() {
		var i, j;

		implementationLoop : for ( i in implementations ) {
			for ( j in implementations[ i ] ) {
				if ( implementations[ i ][ j ].checkRequirements() ) {
					if ( currentImplementation && _.isFunction( currentImplementation.close ) ) {
						currentImplementation.close();
					}

					currentImplementation = implementations[ i ][ j ];
					if ( _.isFunction( currentImplementation.init ) ) {
						currentImplementation.init();
					}

					loggedError = false;
					break implementationLoop;
				}
			}
		}
	}

	/**
	 * Logs an error message that no cache implementation is set, if it has not been logged before.
	 *
	 * @since 0.1.0
	 */
	function maybeLogError() {
		if ( loggedError ) {
			return;
		}

		console.error( window.wpCacheSettings.i18n.noImplementationSet );
		loggedError = true;
	}

	window.wp = window.wp || {};

	window.wp.cache = window.wp.cache || {

		MINUTE_IN_SECONDS: 60,

		HOUR_IN_SECONDS: 3600,

		DAY_IN_SECONDS: 86400,

		WEEK_IN_SECONDS: 604800,

		YEAR_IN_SECONDS: 31536000,

		/**
		 * Adds data to the cache if the cache key doesn't already exist.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               The cache key to use for retrieval later.
		 * @param {mixed}         data              The data to add to the cache.
		 * @param {string}        [group='default'] The group to add the cache to. Enables the same key
		 *                                          to be used across groups.
		 * @param {number}        [expire=0]        When the cache data should expire, in seconds.
		 *                                          0 means no expiration.
		 * @returns {boolean} True on success, false if cache key and group already exist.
		 */
		add: function( key, data, group, expire ) {
			group = group || 'default';
			expire = expire || 0;

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.add( key, data, group, parseInt( expire, 10 ) );
		},

		/**
		 * Replaces the contents of the cache with new data.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               The key for the cache data that should be replaced.
		 * @param {mixed}         data              The new data to store in the cache.
		 * @param {string}        [group='default'] The group for the cache data that should be replaced.
		 * @param {number}        [expire=0]        When to expire the cache contents, in seconds.
		 *                                          0 means no expiration.
		 * @returns {boolean} True if contents were replaced, false if original value does not exist.
		 */
		replace: function( key, data, group, expire ) {
			group = group || 'default';
			expire = expire || 0;

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.replace( key, data, group, parseInt( expire, 10 ) );
		},

		/**
		 * Saves data to the cache.
		 *
		 * Differs from wp.cache.add() and wp.cache.replace() in that it will always write data.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               The cache key to use for retrieval later.
		 * @param {mixed}         data              The contents to store in the cache.
		 * @param {string}        [group='default'] Where to group the cache contents. Enables the same key
		 *                                          to be used across groups.
		 * @param {number}        [expire=0]        When to expire the cache contents, in seconds.
		 *                                          0 means no expiration.
		 * @returns {boolean} True on success, false on failure.
		 */
		set: function( key, data, group, expire ) {
			group = group || 'default';
			expire = expire || 0;

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.set( key, data, group, parseInt( expire, 10 ) );
		},

		/**
		 * Retrieves the cache contents from the cache by key and group.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key                  The key under which the cache contents are stored.
		 * @param {string}        [group='default']    Where the cache contents are grouped.
		 * @param {boolean}       [force=false]        Whether to force an update of the local cache from
		 *                                             the persistent cache.
		 * @returns {mixed|undefined} Cache contents on success or undefined on failure.
		 */
		get: function( key, group, force ) {
			group = group || 'default';
			force = force || false;

			if ( ! currentImplementation ) {
				maybeLogError();
				return undefined;
			}

			return currentImplementation.get( key, group, force );
		},

		/**
		 * Removes the cache contents matching key and group.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               What the contents in the cache are called.
		 * @param {string}        [group='default'] Where the cache contents are grouped.
		 * @returns {boolean} True on successful removal, false on failure.
		 */
		remove: function( key, group ) {
			group = group || 'default';

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.remove( key, group );
		},

		/**
		 * Removes all cache items.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @returns {boolean} True on success, false on failure.
		 */
		flush: function() {
			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.flush();
		},

		/**
		 * Increments a numeric cache item's value.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               The key for the cache contents that should be incremented.
		 * @param {number}        [offset=1]        The amount by which to increment the item's value.
		 * @param {string}        [group='default'] The group the key is in.
		 * @returns {number|boolean} The item's new value on success, false on failure.
		 */
		incr: function( key, offset, group ) {
			offset = offset || 1;
			group = group || 'default';

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.incr( key, parseInt( offset, 10 ), group );
		},

		/**
		 * Decrements a numeric cache item's value.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number|string} key               The key for the cache contents that should be decremented.
		 * @param {number}        [offset=1]        The amount by which to decrement the item's value.
		 * @param {string}        [group='default'] The group the key is in.
		 * @returns {number|boolean} The item's new value on success, false on failure.
		 */
		decr: function( key, offset, group ) {
			offset = offset || 1;
			group = group || 'default';

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.decr( key, parseInt( offset, 10 ), group );
		},

		/**
		 * Switches the internal site ID.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number} siteId Site ID.
		 * @returns {boolean} True if the site was switched, false otherwise.
		 */
		switchToSite: function( siteId ) {
			if ( ! window.wpCacheSettings.isMultisite ) {
				return false;
			}

			siteId = parseInt( siteId, 10 );

			if ( siteId === window.wpCacheSettings.siteId ) {
				return true;
			}

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			return currentImplementation.switchToSite( siteId );
		},

		/**
		 * Switches the internal network ID.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {number} networkId Network ID.
		 * @returns {boolean} True if the network was switched, false otherwise.
		 */
		switchToNetwork: function( networkId ) {
			if ( ! window.wpCacheSettings.isMultisite ) {
				return false;
			}

			networkId = parseInt( networkId, 10 );

			if ( networkId === window.wpCacheSettings.networkId ) {
				return true;
			}

			if ( ! currentImplementation ) {
				maybeLogError();
				return false;
			}

			currentImplementation.switchToNetwork( networkId );
		},

		/**
		 * Adds a group or set of groups to the list of network groups.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {string|string[]} groups A group or an array of groups to add.
		 */
		addNetworkGroups: function( groups ) {
			if ( ! currentImplementation ) {
				maybeLogError();
				return;
			}

			currentImplementation.addNetworkGroups( groups );
		},

		/**
		 * Adds a group or set of groups to the list of global groups.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {string|string[]} groups A group or an array of groups to add.
		 */
		addGlobalGroups: function( groups ) {
			if ( ! currentImplementation ) {
				maybeLogError();
				return;
			}

			currentImplementation.addGlobalGroups( groups );
		},

		/**
		 * Adds a group or set of groups to the list of non-persistent groups.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {string|string[]} groups A group or an array of groups to add.
		 */
		addNonPersistentGroups: function( groups ) {
			if ( ! currentImplementation ) {
				maybeLogError();
				return;
			}

			currentImplementation.addNonPersistentGroups( groups );
		},

		/**
		 * Initializes the cache.
		 *
		 * This method is optional and does not need to be implemented by the cache
		 * implementation unless necessary.
		 *
		 * @since 0.1.0
		 * @access public
		 */
		init: function() {
			if ( ! currentImplementation ) {
				maybeLogError();
				return;
			}

			if ( ! _.isFunction( currentImplementation.init ) ) {
				return;
			}

			currentImplementation.init();
		},

		/**
		 * Closes the cache.
		 *
		 * This method is optional and does not need to be implemented by the cache
		 * implementation unless necessary.
		 *
		 * @since 0.1.0
		 * @access public
		 */
		close: function() {
			if ( ! currentImplementation ) {
				maybeLogError();
				return;
			}

			if ( ! _.isFunction( currentImplementation.close ) ) {
				return;
			}

			currentImplementation.close();
		},

		/**
		 * Registers a cache implementation.
		 *
		 * @since 0.1.0
		 * @access public
		 *
		 * @param {string} identifier     Unique identifier for the implementation.
		 * @param {object} implementation The actual implementation.
		 * @param {number} [priority=10]  Priority for the implementation.
		 * @returns {boolean} True on success, false on failure.
		 */
		registerImplementation: function( identifier, implementation, priority ) {
			var requiredMethods = [
				'add',
				'replace',
				'set',
				'get',
				'remove',
				'flush',
				'incr',
				'decr',
				'switchToSite',
				'switchToNetwork',
				'addNetworkGroups',
				'addGlobalGroups',
				'addNonPersistentGroups',
				'checkRequirements'
			], i;

			for ( i in requiredMethods ) {
				if ( ! _.isFunction( implementation[ requiredMethods[ i ] ] ) ) {
					return false;
				}
			}

			priority = priority || 10;

			implementation.identifier = identifier;
			implementation.priority   = priority;

			if ( _.isUndefined( implementations[ priority ] ) ) {
				implementations[ priority ] = [];
			}

			implementations[ priority ].push( implementation );

			if ( ! currentImplementation || currentImplementation.priority > priority ) {
				setCurrentImplementation();
			}

			return true;
		}
	};
})( window, window._ );
