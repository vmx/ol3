// FIXME getView3D has not return type
// FIXME remove getExtent?

goog.provide('ol.View2D');
goog.provide('ol.View2DProperty');

goog.require('goog.asserts');
goog.require('goog.vec.Mat3');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('ol.Constraints');
goog.require('ol.Coordinate');
goog.require('ol.IView2D');
goog.require('ol.IView3D');
goog.require('ol.Projection');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.RotationConstraintType');
goog.require('ol.Size');
goog.require('ol.View');
goog.require('ol.View3D');
goog.require('ol.coordinate');
goog.require('ol.ellipsoid.WGS84');
goog.require('ol.extent');
goog.require('ol.projection');
goog.require('ol.vec.Mat3');


/**
 * @enum {string}
 */
ol.View2DProperty = {
  CENTER: 'center',
  PROJECTION: 'projection',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};



/**
 * @constructor
 * @implements {ol.IView2D}
 * @implements {ol.IView3D}
 * @extends {ol.View}
 * @param {ol.View2DOptions=} opt_options View2D options.
 */
ol.View2D = function(opt_options) {
  goog.base(this);
  var options = opt_options || {};

  /**
   * @type {Object.<string, *>}
   */
  var values = {};
  values[ol.View2DProperty.CENTER] = goog.isDef(options.center) ?
      options.center : null;
  values[ol.View2DProperty.PROJECTION] = ol.projection.createProjection(
      options.projection, 'EPSG:3857');
  if (goog.isDef(options.resolution)) {
    values[ol.View2DProperty.RESOLUTION] = options.resolution;
  } else if (goog.isDef(options.zoom)) {
    var projectionExtent = values[ol.View2DProperty.PROJECTION].getExtent();
    var size = Math.max(
        projectionExtent[1] - projectionExtent[0],
        projectionExtent[3] - projectionExtent[2]);
    values[ol.View2DProperty.RESOLUTION] =
        size / (ol.DEFAULT_TILE_SIZE * Math.pow(2, options.zoom));
  }
  values[ol.View2DProperty.ROTATION] = options.rotation;
  this.setValues(values);

  var parts = ol.View2D.createResolutionConstraint_(options);

  /**
   * @private
   * @type {number}
   */
  this.maxResolution_ = parts[1];

  /**
   * @private
   * @type {number}
   */
  this.minResolution_ = parts[2];

  var resolutionConstraint = parts[0];
  var rotationConstraint = ol.View2D.createRotationConstraint_(options);

  /**
   * @private
   * @type {ol.Constraints}
   */
  this.constraints_ = new ol.Constraints(resolutionConstraint,
      rotationConstraint);

  if (goog.isDef(options.view3D)) {
    this._view3D = options.view3D;
  }

};
goog.inherits(ol.View2D, ol.View);


/**
 * @param {number} rotation Target rotation.
 * @param {ol.Coordinate} anchor Rotation anchor.
 * @return {ol.Coordinate|undefined} Center for rotation and anchor.
 */
ol.View2D.prototype.calculateCenterRotate = function(rotation, anchor) {
  var center;
  var currentCenter = this.getCenter();
  if (goog.isDef(currentCenter)) {
    center = [currentCenter[0] - anchor[0], currentCenter[1] - anchor[1]];
    ol.coordinate.rotate(center, rotation - this.getRotation());
    ol.coordinate.add(center, anchor);
  }
  return center;
};


/**
 * @param {number} resolution Target resolution.
 * @param {ol.Coordinate} anchor Zoom anchor.
 * @return {ol.Coordinate|undefined} Center for resolution and anchor.
 */
ol.View2D.prototype.calculateCenterZoom = function(resolution, anchor) {
  var center;
  var currentCenter = this.getCenter();
  var currentResolution = this.getResolution();
  if (goog.isDef(currentCenter) && goog.isDef(currentResolution)) {
    var x = anchor[0] -
        resolution * (anchor[0] - currentCenter[0]) / currentResolution;
    var y = anchor[1] -
        resolution * (anchor[1] - currentCenter[1]) / currentResolution;
    center = [x, y];
  }
  return center;
};


/**
 * @param {number|undefined} resolution Resolution.
 * @param {number=} opt_delta Delta.
 * @param {number=} opt_direction Direction.
 * @return {number|undefined} Constrained resolution.
 */
ol.View2D.prototype.constrainResolution = function(
    resolution, opt_delta, opt_direction) {
  var delta = opt_delta || 0;
  var direction = opt_direction || 0;
  return this.constraints_.resolution(resolution, delta, direction);
};


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number=} opt_delta Delta.
 * @return {number|undefined} Constrained rotation.
 */
ol.View2D.prototype.constrainRotation = function(rotation, opt_delta) {
  var delta = opt_delta || 0;
  return this.constraints_.rotation(rotation, delta);
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getCenter = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View2DProperty.CENTER));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getCenter',
    ol.View2D.prototype.getCenter);


/**
 * @param {ol.Size} size Box pixel size.
 * @return {ol.Extent} Extent.
 */
ol.View2D.prototype.getExtent = function(size) {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var resolution = this.getResolution();
  var minX = center[0] - resolution * size.width / 2;
  var maxX = center[0] + resolution * size.width / 2;
  var minY = center[1] - resolution * size.height / 2;
  var maxY = center[1] + resolution * size.height / 2;
  return [minX, maxX, minY, maxY];
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getProjection = function() {
  return /** @type {ol.Projection|undefined} */ (
      this.get(ol.View2DProperty.PROJECTION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getProjection',
    ol.View2D.prototype.getProjection);


/**
 * @inheritDoc
 */
ol.View2D.prototype.getResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View2DProperty.RESOLUTION));
};
goog.exportProperty(
    ol.View2D.prototype,
    'getResolution',
    ol.View2D.prototype.getResolution);


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @return {number} Resolution.
 */
ol.View2D.prototype.getResolutionForExtent = function(extent, size) {
  var xResolution = (extent[1] - extent[0]) / size.width;
  var yResolution = (extent[3] - extent[2]) / size.height;
  return Math.max(xResolution, yResolution);
};


/**
 * Return a function that returns a value between 0 and 1 for a
 * resolution. Exponential scaling is assumed.
 * @param {number=} opt_power Power.
 * @return {function(number): number} Resolution for value function.
 */
ol.View2D.prototype.getResolutionForValueFunction = function(opt_power) {
  var power = opt_power || 2;
  var maxResolution = this.maxResolution_;
  var minResolution = this.minResolution_;
  var max = Math.log(maxResolution / minResolution) / Math.log(power);
  return (
      /**
       * @param {number} value Value.
       * @return {number} Resolution.
       */
      function(value) {
        var resolution = maxResolution / Math.pow(power, value * max);
        goog.asserts.assert(resolution >= minResolution &&
            resolution <= maxResolution);
        return resolution;
      });
};


/**
 * @return {number} Map rotation.
 */
ol.View2D.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View2DProperty.ROTATION)) || 0;
};
goog.exportProperty(
    ol.View2D.prototype,
    'getRotation',
    ol.View2D.prototype.getRotation);


/**
 * Return a function that returns a resolution for a value between
 * 0 and 1. Exponential scaling is assumed.
 * @param {number=} opt_power Power.
 * @return {function(number): number} Value for resolution function.
 */
ol.View2D.prototype.getValueForResolutionFunction = function(opt_power) {
  var power = opt_power || 2;
  var maxResolution = this.maxResolution_;
  var minResolution = this.minResolution_;
  var max = Math.log(maxResolution / minResolution) / Math.log(power);
  return (
      /**
       * @param {number} resolution Resolution.
       * @return {number} Value.
       */
      function(resolution) {
        var value =
            (Math.log(maxResolution / resolution) / Math.log(power)) / max;
        goog.asserts.assert(value >= 0 && value <= 1);
        return value;
      });
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getView2D = function() {
  return this;
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getView2DState = function() {
  goog.asserts.assert(this.isDef());
  var center = /** @type {ol.Coordinate} */ (this.getCenter());
  var projection = /** @type {ol.Projection} */ (this.getProjection());
  var resolution = /** @type {number} */ (this.getResolution());
  var rotation = /** @type {number} */ (this.getRotation());
  return {
    center: center.slice(),
    projection: projection,
    resolution: resolution,
    rotation: rotation
  };
};


/**
 * @inheritDoc
 */
ol.View2D.prototype.getView3D = function() {
  return this.createView3D_();
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 */
ol.View2D.prototype.fitExtent = function(extent, size) {
  this.setCenter(ol.extent.getCenter(extent));
  var resolution = this.getResolutionForExtent(extent, size);
  resolution = this.constrainResolution(resolution, 0, 0);
  this.setResolution(resolution);
};


/**
 * @return {boolean} Is defined.
 */
ol.View2D.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution());
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 */
ol.View2D.prototype.setCenter = function(center) {
  this.set(ol.View2DProperty.CENTER, center);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setCenter',
    ol.View2D.prototype.setCenter);


/**
 * @param {ol.Projection|undefined} projection Projection.
 */
ol.View2D.prototype.setProjection = function(projection) {
  this.set(ol.View2DProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setProjection',
    ol.View2D.prototype.setProjection);


/**
 * @param {number|undefined} resolution Resolution.
 */
ol.View2D.prototype.setResolution = function(resolution) {
  this.set(ol.View2DProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setResolution',
    ol.View2D.prototype.setResolution);


/**
 * @param {number|undefined} rotation Rotation.
 */
ol.View2D.prototype.setRotation = function(rotation) {
  this.set(ol.View2DProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.View2D.prototype,
    'setRotation',
    ol.View2D.prototype.setRotation);


/**
 * @private
 * @return {ol.IView3D} View 3D.
 */
ol.View2D.prototype.createView3D_ = function() {
  var center = /** @type {ol.Coordinate} */ (this.getCenter());
  var projection = /** @type {ol.Projection} */ (this.getProjection());
  var resolution = /** @type {number} */ (this.getResolution());
  var newCenter = ol.projection.transform(center, projection,
      ol.projection.get('EPSG:3857'));
  newCenter[2] = resolution * ol.DEFAULT_TILE_SIZE;

  //unproject
  var cartographic = projection.unproject(ol.ellipsoid.WGS84, newCenter);

  //cartographicToCartesian
  //TODO cartographic should be it's own type and not use ol.Coordinate.
  //TODO can we pass goog.vec.Vec3 around?
  var cartesian = ol.ellipsoid.WGS84.cartographicToCartesian(
      cartographic[0],
      cartographic[1],
      cartographic[2]);
  var result = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(result,
      cartesian[0], cartesian[1], cartesian[2]);
  //camera stuff
  var unitZ = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(unitZ, 0.0, 0.0, 1.0);

  var d = goog.vec.Vec3.createNumber();
  var r = goog.vec.Vec3.createNumber();
  var u = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.negate(result, d);
  goog.vec.Vec3.normalize(d, d);
  goog.vec.Vec3.cross(d, unitZ, r);
  goog.vec.Vec3.cross(r, d, u);
  var angle = /** @type {number} */ (this.getRotation());

  var quat = goog.vec.Quaternion.createNumber();
  var rotation = goog.vec.Mat3.createNumber();
  goog.vec.Quaternion.fromAngleAxis(angle, d, quat);
  ol.vec.Mat3.fromQuaternion(quat, rotation);
  goog.vec.Mat3.multVec3(rotation, u, u);
  goog.vec.Vec3.cross(d, u, r);

  center = [result[0], result[1], result[2]];
  var direction = [d[0], d[1], d[2]];
  var right = [r[0], r[1], r[2]];
  var up = [u[0], u[1], u[2]];

  return new ol.View3D({
    center: center,
    projection: ol.projection.get('EPSG:3857'),
    resolution: resolution,
    direction: direction,
    right: right,
    up: up
  });
};


/**
 * @private
 * @param {ol.View2DOptions} options View2D options.
 * @return {Array} Array of three elements: the resolution constraint,
 *     maxResolution, and minResolution.
 */
ol.View2D.createResolutionConstraint_ = function(options) {
  var resolutionConstraint;
  var maxResolution;
  var minResolution;
  if (goog.isDef(options.resolutions)) {
    var resolutions = options.resolutions;
    maxResolution = resolutions[0];
    minResolution = resolutions[resolutions.length - 1];
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        resolutions);
  } else {
    maxResolution = options.maxResolution;
    if (!goog.isDef(maxResolution)) {
      var projectionExtent = ol.projection.createProjection(
          options.projection, 'EPSG:3857').getExtent();
      maxResolution = Math.max(
          projectionExtent[1] - projectionExtent[0],
          projectionExtent[3] - projectionExtent[2]) / ol.DEFAULT_TILE_SIZE;
    }
    var maxZoom = options.maxZoom;
    if (!goog.isDef(maxZoom)) {
      maxZoom = 28;
    }
    var zoomFactor = options.zoomFactor;
    if (!goog.isDef(zoomFactor)) {
      zoomFactor = 2;
    }
    minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(
        zoomFactor, maxResolution, maxZoom);
  }
  return [resolutionConstraint, maxResolution, minResolution];
};


/**
 * @private
 * @param {ol.View2DOptions} options View2D options.
 * @return {ol.RotationConstraintType} Rotation constraint.
 */
ol.View2D.createRotationConstraint_ = function(options) {
  // FIXME rotation constraint is not configurable at the moment
  return ol.RotationConstraint.createSnapToZero();
};


/**
 * @return {ol.Coordinate|undefined} 3D map direction.
 */
ol.View2D.prototype.getDirection = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map right.
 */
ol.View2D.prototype.getRight = function() {
};


/**
 * @return {ol.Coordinate|undefined} 3D map up.
 */
ol.View2D.prototype.getUp = function() {
};
