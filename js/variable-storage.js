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
