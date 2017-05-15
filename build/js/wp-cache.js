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

( function( cache, _, settings ) {
	'use strict';

	var nonPersistentData = {},
		nonPersistentGroups = {},
		networkGroups = {},
		globalGroups = {},
		currentSiteId = settings.siteId,
		currentNetworkId = settings.networkId,
		implementation;

	function getCurrentTime() {
		return Math.floor( Date.now() / 1000 );
	}

	function getFullKey( key, group ) {
		if ( globalGroups[ group ] ) {
			return key;
		}

		if ( networkGroups[ group ] ) {
			return 'network' + currentNetworkId + '_' + key;
		}

		return 'site' + currentSiteId + '_' + key;
	}

	function getLocalStorageIdentifier( key, group, isFullKey ) {
		if ( ! isFullKey ) {
			key = getFullKey( key, group );
		}

		return 'wpCache:' + group + ':' + key;
	}

	function getFullDataObject( data, expire ) {
		if ( _.isObject( data ) && ! _.isNull( data ) && ! _.isArray( data ) ) {
			data = _.extend({}, data );
		}

		if ( expire ) {
			expire = getCurrentTime() + expire;
		}

		return {
			data: data,
			expire: expire
		};
	}

	function getFromFullDataObject( dataObject ) {
		if ( _.isObject( dataObject.data ) && ! _.isNull( dataObject.data ) && ! _.isArray( dataObject.data ) ) {
			return _.extend({}, dataObject.data );
		}

		return dataObject.data;
	}

	function exists( key, group, isFullKey ) {
		var item;

		key = getLocalStorageIdentifier( key, group, isFullKey );

		item = localStorage.getItem( key );
		if ( ! item ) {
			return false;
		}

		item = JSON.parse( item );
		if ( ! _.isObject( item ) ) {
			localStorage.removeItem( key );
			return false;
		}

		if ( item.expire && item.expire < getCurrentTime() ) {
			localStorage.removeItem( key );
			return false;
		}

		return true;
	}

	function existsNonPersistent( key, group, isFullKey ) {
		var item;

		if ( _.isUndefined( nonPersistentData[ group ] ) ) {
			return false;
		}

		if ( ! isFullKey ) {
			key = getFullKey( key, group );
		}

		if ( _.isUndefined( nonPersistentData[ group ][ key ] ) ) {
			return false;
		}

		item = nonPersistentData[ group ][ key ];
		if ( item.expire && item.expire < getCurrentTime() ) {
			delete nonPersistentData[ group ][ key ];
			return false;
		}

		return true;
	}

	implementation = {

		add: function( key, data, group, expire ) {
			if ( nonPersistentGroups[ group ] ) {
				if ( existsNonPersistent( key, group ) ) {
					return false;
				}

				return implementation.set( key, data, group, expire );
			}

			if ( exists( key, group ) ) {
				return false;
			}

			return implementation.set( key, data, group, expire );
		},

		replace: function( key, data, group, expire ) {
			if ( nonPersistentGroups[ group ] ) {
				if ( ! existsNonPersistent( key, group ) ) {
					return false;
				}

				return implementation.set( key, data, group, expire );
			}

			if ( ! exists( key, group ) ) {
				return false;
			}

			return implementation.set( key, data, group, expire );
		},

		set: function( key, data, group, expire ) {
			key = getFullKey( key, group );
			data = getFullDataObject( data, expire );

			if ( nonPersistentGroups[ group ] ) {
				if ( _.isUndefined( nonPersistentData[ group ] ) ) {
					nonPersistentData[ group ] = {};
				}

				nonPersistentData[ group ][ key ] = data;

				return true;
			}

			key = getLocalStorageIdentifier( key, group, true );
			localStorage.setItem( key, JSON.stringify( data ) );

			return true;
		},

		get: function( key, group ) {
			key = getFullKey( key, group );

			if ( nonPersistentGroups[ group ] ) {
				if ( ! existsNonPersistent( key, group, true ) ) {
					return undefined;
				}

				return getFromFullDataObject( nonPersistentData[ group ][ key ] );
			}

			if ( ! exists( key, group, true ) ) {
				return undefined;
			}

			key = getLocalStorageIdentifier( key, group, true );

			return getFromFullDataObject( JSON.parse( localStorage.getItem( key ) ) );
		},

		remove: function( key, group ) {
			key = getFullKey( key, group );

			if ( nonPersistentGroups[ group ] ) {
				if ( ! existsNonPersistent( key, group, true ) ) {
					return false;
				}

				delete nonPersistentData[ group ][ key ];

				return true;
			}

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			key = getLocalStorageIdentifier( key, group, true );

			localStorage.removeItem( key );

			return true;
		},

		flush: function() {
			var keys, i;

			nonPersistentData = {};

			keys = Object.keys( localStorage );
			for ( i in keys ) {
				if ( 'wpCache:' === keys[ i ].substring( 0, 8 ) ) {
					localStorage.removeItem( keys[ i ] );
				}
			}

			return true;
		},

		incr: function( key, offset, group ) {
			var dataObject;

			key = getFullKey( key, group );

			if ( nonPersistentGroups[ group ] ) {
				if ( ! existsNonPersistent( key, group, true ) ) {
					return false;
				}

				if ( ! _.isNumber( nonPersistentData[ group ][ key ].data ) ) {
					nonPersistentData[ group ][ key ].data = 0;
				}

				nonPersistentData[ group ][ key ].data += offset;

				if ( nonPersistentData[ group ][ key ].data < 0 ) {
					nonPersistentData[ group ][ key ].data = 0;
				}

				return nonPersistentData[ group ][ key ].data;
			}

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			key = getLocalStorageIdentifier( key, group, true );

			dataObject = JSON.parse( localStorage.getItem( key ) );

			if ( ! _.isNumber( dataObject.data ) ) {
				dataObject.data = 0;
			}

			dataObject.data += offset;

			if ( dataObject.data < 0 ) {
				dataObject.data = 0;
			}

			localStorage.setItem( key, JSON.stringify( dataObject ) );

			return dataObject.data;
		},

		decr: function( key, offset, group ) {
			var dataObject;

			key = getFullKey( key, group );

			if ( nonPersistentGroups[ group ] ) {
				if ( ! existsNonPersistent( key, group, true ) ) {
					return false;
				}

				if ( ! _.isNumber( nonPersistentData[ group ][ key ].data ) ) {
					nonPersistentData[ group ][ key ].data = 0;
				}

				nonPersistentData[ group ][ key ].data -= offset;

				if ( nonPersistentData[ group ][ key ].data < 0 ) {
					nonPersistentData[ group ][ key ].data = 0;
				}

				return nonPersistentData[ group ][ key ].data;
			}

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			key = getLocalStorageIdentifier( key, group, true );

			dataObject = JSON.parse( localStorage.getItem( key ) );

			if ( ! _.isNumber( dataObject.data ) ) {
				dataObject.data = 0;
			}

			dataObject.data -= offset;

			if ( dataObject.data < 0 ) {
				dataObject.data = 0;
			}

			localStorage.setItem( key, JSON.stringify( dataObject ) );

			return dataObject.data;
		},

		switchToSite: function( siteId ) {
			currentSiteId = siteId;

			return true;
		},

		switchToNetwork: function( networkId ) {
			currentNetworkId = networkId;

			return true;
		},

		addNetworkGroups: function( groups ) {
			var i;

			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( i in groups ) {
				if ( networkGroups[ groups[ i ] ] ) {
					continue;
				}

				networkGroups[ groups[ i ] ] = true;
			}
		},

		addGlobalGroups: function( groups ) {
			var i;

			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( i in groups ) {
				if ( globalGroups[ groups[ i ] ] ) {
					continue;
				}

				globalGroups[ groups[ i ] ] = true;
			}
		},

		addNonPersistentGroups: function( groups ) {
			var i;

			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( i in groups ) {
				if ( nonPersistentGroups[ groups[ i ] ] ) {
					continue;
				}

				nonPersistentGroups[ groups[ i ] ] = true;
			}
		},

		checkRequirements: function() {
			return ! _.isUndefined( localStorage ) && ! _.isUndefined( JSON );
		}
	};

	cache.registerImplementation( 'localStorage', implementation, 10 );

})( window.wp.cache, window._, window.wpCacheSettings );

( function( cache, _, settings ) {
	'use strict';

	var cachedData = {},
		networkGroups = {},
		globalGroups = {},
		currentSiteId = settings.siteId,
		currentNetworkId = settings.networkId,
		implementation;

	function getCurrentTime() {
		return Math.floor( Date.now() / 1000 );
	}

	function getFullKey( key, group ) {
		if ( globalGroups[ group ] ) {
			return key;
		}

		if ( networkGroups[ group ] ) {
			return 'network' + currentNetworkId + '_' + key;
		}

		return 'site' + currentSiteId + '_' + key;
	}

	function getFullDataObject( data, expire ) {
		if ( _.isObject( data ) && ! _.isNull( data ) && ! _.isArray( data ) ) {
			data = _.extend({}, data );
		}

		if ( expire ) {
			expire = getCurrentTime() + expire;
		}

		return {
			data: data,
			expire: expire
		};
	}

	function getFromFullDataObject( dataObject ) {
		if ( _.isObject( dataObject.data ) && ! _.isNull( dataObject.data ) && ! _.isArray( dataObject.data ) ) {
			return _.extend({}, dataObject.data );
		}

		return dataObject.data;
	}

	function exists( key, group, isFullKey ) {
		var item;

		if ( _.isUndefined( cachedData[ group ] ) ) {
			return false;
		}

		if ( ! isFullKey ) {
			key = getFullKey( key, group );
		}

		if ( _.isUndefined( cachedData[ group ][ key ] ) ) {
			return false;
		}

		item = cachedData[ group ][ key ];
		if ( item.expire && item.expire < getCurrentTime() ) {
			delete cachedData[ group ][ key ];
			return false;
		}

		return true;
	}

	implementation = {

		add: function( key, data, group, expire ) {
			if ( exists( key, group ) ) {
				return false;
			}

			return implementation.set( key, data, group, expire );
		},

		replace: function( key, data, group, expire ) {
			if ( ! exists( key, group ) ) {
				return false;
			}

			return implementation.set( key, data, group, expire );
		},

		set: function( key, data, group, expire ) {
			key = getFullKey( key, group );
			data = getFullDataObject( data, expire );

			if ( _.isUndefined( cachedData[ group ] ) ) {
				cachedData[ group ] = {};
			}

			cachedData[ group ][ key ] = data;

			return true;
		},

		get: function( key, group ) {
			key = getFullKey( key, group );

			if ( ! exists( key, group, true ) ) {
				return undefined;
			}

			return getFromFullDataObject( cachedData[ group ][ key ] );
		},

		remove: function( key, group ) {
			key = getFullKey( key, group );

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			delete cachedData[ group ][ key ];

			return true;
		},

		flush: function() {
			cachedData = {};

			return true;
		},

		incr: function( key, offset, group ) {
			key = getFullKey( key, group );

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			if ( ! _.isNumber( cachedData[ group ][ key ].data ) ) {
				cachedData[ group ][ key ].data = 0;
			}

			cachedData[ group ][ key ].data += offset;

			if ( cachedData[ group ][ key ].data < 0 ) {
				cachedData[ group ][ key ].data = 0;
			}

			return cachedData[ group ][ key ].data;
		},

		decr: function( key, offset, group ) {
			key = getFullKey( key, group );

			if ( ! exists( key, group, true ) ) {
				return false;
			}

			if ( ! _.isNumber( cachedData[ group ][ key ].data ) ) {
				cachedData[ group ][ key ].data = 0;
			}

			cachedData[ group ][ key ].data -= offset;

			if ( cachedData[ group ][ key ].data < 0 ) {
				cachedData[ group ][ key ].data = 0;
			}

			return cachedData[ group ][ key ].data;
		},

		switchToSite: function( siteId ) {
			currentSiteId = siteId;

			return true;
		},

		switchToNetwork: function( networkId ) {
			currentNetworkId = networkId;

			return true;
		},

		addNetworkGroups: function( groups ) {
			var i;

			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( i in groups ) {
				if ( networkGroups[ groups[ i ] ] ) {
					continue;
				}

				networkGroups[ groups[ i ] ] = true;
			}
		},

		addGlobalGroups: function( groups ) {
			var i;

			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( i in groups ) {
				if ( globalGroups[ groups[ i ] ] ) {
					continue;
				}

				globalGroups[ groups[ i ] ] = true;
			}
		},

		addNonPersistentGroups: function() {
			/* Default cache doesn't persist so nothing to do here. */
		},

		checkRequirements: function() {
			return true;
		}
	};

	cache.registerImplementation( 'variableStorage', implementation, 100 );

})( window.wp.cache, window._, window.wpCacheSettings );
