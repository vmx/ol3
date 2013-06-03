goog.provide('ol.projection.EPSG3857');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.math');
goog.require('ol.projection');



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 */
ol.projection.EPSG3857 = function(code) {
  goog.base(this, {
    code: code,
    units: ol.ProjectionUnits.METERS,
    extent: ol.projection.EPSG3857.EXTENT,
    global: true
  });
};
goog.inherits(ol.projection.EPSG3857, ol.Projection);


/**
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.RADIUS = 6378137;


/**
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.PI_OVER_TWO = Math.PI * 0.5;


/**
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.HALF_SIZE = Math.PI * ol.projection.EPSG3857.RADIUS;


/**
 * Converts a Mercator angle, in the range -PI to PI, to a geodetic latitude
 * in the range -PI/2 to PI/2.
 * @param {number} mercatorAngle Angle to convert.
 * @return {number} The geodetic latitude equivalent.
 */
ol.projection.EPSG3857.mercatorAngleToGeodeticLatitude =
    function(mercatorAngle) {
  return ol.projection.EPSG3857.PI_OVER_TWO -
      (2.0 * Math.atan(Math.exp(-mercatorAngle)));
};


/**
 * The maximum latitude (both North and South) supported by a Web Mercator
 * (EPSG:3857) projection.  Technically, the Mercator projection is defined
 * for any latitude up to (but not including) 90 degrees, but it makes sense
 * to cut it off sooner because it grows exponentially with increasing latitude.
 * The logic behind this particular cutoff value, which is the one used by
 * Google Maps, Bing Maps, and Esri, is that it makes the projection
 * square.  That is, the extent is equal in the X and Y directions.
 *
 * The constant value is computed by calling:
 *    WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI)
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.MAXIMUM_LATITUDE =
    ol.projection.EPSG3857.mercatorAngleToGeodeticLatitude(Math.PI);


/**
 * @const
 * @type {ol.Extent}
 */
ol.projection.EPSG3857.EXTENT = [
  -ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE,
  -ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE
];


/**
 * Lists several projection codes with the same meaning as EPSG:3857.
 *
 * @type {Array.<string>}
 */
ol.projection.EPSG3857.CODES = [
  'EPSG:3857',
  'EPSG:102100',
  'EPSG:102113',
  'EPSG:900913',
  'urn:ogc:def:crs:EPSG:6.18:3:3857'
];


/**
 * Projections equal to EPSG:3857.
 *
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.projection.EPSG3857.PROJECTIONS = goog.array.map(
    ol.projection.EPSG3857.CODES,
    function(code) {
      return new ol.projection.EPSG3857(code);
    });


/**
 * Transformation from EPSG:4326 to EPSG:3857.
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.projection.EPSG3857.fromEPSG4326 = function(
    input, opt_output, opt_dimension) {
  var length = input.length,
      dimension = opt_dimension > 1 ? opt_dimension : 2,
      output = opt_output;
  if (!goog.isDef(output)) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  goog.asserts.assert(output.length % dimension === 0);
  for (var i = 0; i < length; i += dimension) {
    output[i] = ol.projection.EPSG3857.RADIUS * Math.PI * input[i] / 180;
    output[i + 1] = ol.projection.EPSG3857.RADIUS *
        Math.log(Math.tan(Math.PI * (input[i + 1] + 90) / 360));
  }
  return output;
};


/**
 * Transformation from EPSG:3857 to EPSG:4326.
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.projection.EPSG3857.toEPSG4326 = function(input, opt_output, opt_dimension) {
  var length = input.length,
      dimension = opt_dimension > 1 ? opt_dimension : 2,
      output = opt_output;
  if (!goog.isDef(output)) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  goog.asserts.assert(output.length % dimension === 0);
  for (var i = 0; i < length; i += dimension) {
    output[i] = 180 * input[i] / (ol.projection.EPSG3857.RADIUS * Math.PI);
    output[i + 1] = 360 * Math.atan(
        Math.exp(input[i + 1] / ol.projection.EPSG3857.RADIUS)) / Math.PI - 90;
  }
  return output;
};


/**
 * @inheritDoc
 */
ol.projection.EPSG3857.prototype.getPointResolution =
    function(resolution, point) {
  return resolution / ol.math.cosh(point[1] / ol.projection.EPSG3857.RADIUS);
};


/**
 * @inheritDoc
 */
ol.projection.EPSG3857.prototype.unproject =
    function(ellipsoid, point) {
  var semimajorAxis = ellipsoid.getMaximumRadius();
  var oneOverEarthSemimajorAxis = 1.0 / semimajorAxis;
  var longitude = point[0] * oneOverEarthSemimajorAxis;
  var latitude = ol.projection.EPSG3857.mercatorAngleToGeodeticLatitude(
      point[1] * oneOverEarthSemimajorAxis);
  var height = point[2];
  return [longitude, latitude, height];
};


/**
 * Converts a geodetic latitude in radians, in the range -PI/2 to PI/2,
 * to a Mercator angle in the range -PI to PI.
 * @param {number} latitude The geodetic latitude in radians.
 * @return {number} Angle.
 */
ol.projection.EPSG3857.geodeticLatitudeToMercatorAngle = function(latitude) {
  // Clamp the latitude coordinate to the valid Mercator bounds.
  if (latitude > ol.projection.EPSG3857.MAXIMUM_LATITUDE) {
    latitude = ol.projection.EPSG3857.MAXIMUM_LATITUDE;
  } else if (latitude < -ol.projection.EPSG3857.MAXIMUM_LATITUDE) {
    latitude = -ol.projection.EPSG3857.MAXIMUM_LATITUDE;
  }
  var sinLatitude = Math.sin(latitude);
  return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
};


/**
 * @inheritDoc
 */
ol.projection.EPSG3857.prototype.project =
    function(ellipsoid, point) {
  var semimajorAxis = ellipsoid.getMaximumRadius();
  var x = point[0] * semimajorAxis;
  var y = ol.projection.EPSG3857.geodeticLatitudeToMercatorAngle(
      point[1]) * semimajorAxis;
  var z = point[2];
  return [x, y, z];
};
