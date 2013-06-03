goog.provide('ol.IView3D');


/**
 * @typedef {{center: ol.Coordinate,
 *            projection: ol.Projection,
 *            resolution: number,
 *            rotation: number}}
 */
ol.View3DState;



/**
 * Interface for views.
 * @interface
 */
ol.IView3D = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map position.
 */
ol.IView3D.prototype.getCenter = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map direction.
 */
ol.IView3D.prototype.getDirection = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map right.
 */
ol.IView3D.prototype.getRight = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map up.
 */
ol.IView3D.prototype.getUp = function() {
};
