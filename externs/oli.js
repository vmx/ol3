/**
 * @externs
 */


/**
 * @type {Object}
 */
var oli;


/**
 * @interface
 */
oli.control.Control = function() {};


/**
 * @param {ol.MapEvent} mapEvent Map event.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.handleMapPostrender = function(mapEvent) {};


/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};


/**
 * @interface
 */
oli.ImageTile = function() {};


/**
 * @param {string} src The URL that should get loaded.
 * @return {undefined} Undefined.
 */
oli.ImageTile.prototype.loadImage = function(src) {};
