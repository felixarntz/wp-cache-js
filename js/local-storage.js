( function( cache, _, settings ) {
	'use strict';

	var nonPersistentData = {},
		nonPersistentGroups = {},
		networkGroups = {},
		globalGroups = {},
		currentSiteId = settings.siteId,
		currentNetworkId = settings.networkId;

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
		key = getLocalStorageIdentifier( key, group, isFullKey );

		var item = localStorage.getItem( key );
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
		if ( _.isUndefined( nonPersistentData[ group ] ) ) {
			return false;
		}

		if ( ! isFullKey ) {
			key = getFullKey( key, group );
		}

		if ( _.isUndefined( nonPersistentData[ group ][ key ] ) ) {
			return false;
		}

		var item = nonPersistentData[ group ][ key ];
		if ( item.expire && item.expire < getCurrentTime() ) {
			delete nonPersistentData[ group ][ key ];
			return false;
		}

		return true;
	}

	var implementation = {

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
			nonPersistentData = {};

			var keys = Object.keys( localStorage );
			for ( var i in keys ) {
				if ( 'wpCache:' === keys[ i ].substring( 0, 8 ) ) {
					localStorage.removeItem( keys[ i ] );
				}
			}

			return true;
		},

		incr: function( key, offset, group ) {
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

			var dataObject = JSON.parse( localStorage.getItem( key ) );

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

			var dataObject = JSON.parse( localStorage.getItem( key ) );

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
			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( var i in groups ) {
				if ( networkGroups[ groups[ i ] ] ) {
					continue;
				}

				networkGroups[ groups[ i ] ] = true;
			}
		},

		addGlobalGroups: function( groups ) {
			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( var i in groups ) {
				if ( globalGroups[ groups[ i ] ] ) {
					continue;
				}

				globalGroups[ groups[ i ] ] = true;
			}
		},

		addNonPersistentGroups: function( groups ) {
			if ( ! _.isArray( groups ) ) {
				groups = [ groups ];
			}

			for ( var i in groups ) {
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
