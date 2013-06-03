goog.provide('ol.ellipsoid.WGS84');

goog.require('ol.Ellipsoid');


/**
 * @const
 * @type {ol.Ellipsoid}
 */
ol.ellipsoid.WGS84 = new ol.Ellipsoid(6378137,
    6378137,
    6356752.3142451793,
    1 / 298.257223563);
