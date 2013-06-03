goog.provide('ol.View3D');
goog.provide('ol.View3DProperty');

goog.require('goog.asserts');
goog.require('ol.Constraints');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.IView2D');
goog.require('ol.IView3D');
goog.require('ol.Projection');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.Size');
goog.require('ol.View');
//goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.coordinate');
goog.require('ol.easing');
goog.require('ol.ellipsoid.WGS84');
goog.require('ol.extent');
goog.require('ol.projection');


/**
 * @enum {string}
 */
ol.View3DProperty = {
  CENTER: 'center',
  PROJECTION: 'projection',
  DIRECTION: 'direction',
  RIGHT: 'right',
  UP: 'up',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};



/**
 * @constructor
 * @implements {ol.IView2D}
 * @implements {ol.IView3D}
 * @extends {ol.View}
 * @param {ol.View3DOptions=} opt_view3DOptions View3D options.
 */
ol.View3D = function(opt_view3DOptions) {
  goog.base(this);
  var view3DOptions = opt_view3DOptions || {};

  /**
   * @type {Object.<string, *>}
   */
  var values = {};
  values[ol.View3DProperty.CENTER] = goog.isDef(view3DOptions.center) ?
      view3DOptions.center : null;
  values[ol.View3DProperty.PROJECTION] = ol.projection.createProjection(
      view3DOptions.projection, 'EPSG:3857');
  values[ol.View3DProperty.DIRECTION] = goog.isDef(view3DOptions.direction) ?
      view3DOptions.direction : null;
  values[ol.View3DProperty.RIGHT] = goog.isDef(view3DOptions.right) ?
      view3DOptions.right : null;
  values[ol.View3DProperty.UP] = goog.isDef(view3DOptions.up) ?
      view3DOptions.up : null;
  if (goog.isDef(view3DOptions.resolution)) {
    values[ol.View3DProperty.RESOLUTION] = view3DOptions.resolution;
  } else if (goog.isDef(view3DOptions.zoom)) {
    var projectionExtent = values[ol.View3DProperty.PROJECTION].getExtent();
    var size = Math.max(
        projectionExtent.maxX - projectionExtent.minX,
        projectionExtent.maxY - projectionExtent.minY);
    values[ol.View3DProperty.RESOLUTION] =
        size / (ol.DEFAULT_TILE_SIZE * Math.pow(2, view3DOptions.zoom));
  }
  values[ol.View3DProperty.ROTATION] = view3DOptions.rotation;

  this.setValues(values);

  /**
   * @private
   * @type {ol.Constraints}
   */
  this.constraints_ = ol.View3D.createConstraints_(view3DOptions);
  if (goog.isDef(view3DOptions.view2D)) {
    this._view2D = view3DOptions.view2D;
  }
  else {
    var cartographicCoord = /** @type {ol.Coordinate} **/
        (ol.ellipsoid.WGS84.cartesianToCartographic(this.getCenter()));
    var cartesian = this.getProjection().project(ol.ellipsoid.WGS84,
        cartographicCoord);
    this._view2d = new ol.View2D({
      center: cartesian,
      resolution: cartesian[2] / ol.DEFAULT_TILE_SIZE,
      view3D: this
    });
  }

};
goog.inherits(ol.View3D, ol.View);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getCenter = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View3DProperty.CENTER));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getCenter',
    ol.View3D.prototype.getCenter);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getDirection = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View3DProperty.DIRECTION));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getDirection',
    ol.View3D.prototype.getDirection);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getRight = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View3DProperty.RIGHT));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getRight',
    ol.View3D.prototype.getRight);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getUp = function() {
  return /** @type {ol.Coordinate|undefined} */ (
      this.get(ol.View3DProperty.UP));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getUp',
    ol.View3D.prototype.getUp);


/**
 * @param {ol.Size} size Box pixel size.
 * @return {ol.Extent} Extent.
 */
ol.View3D.prototype.getExtent = function(size) {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var resolution = this.getResolution();
  var minX = center.x - resolution * size.width / 2;
  var minY = center.y - resolution * size.height / 2;
  var maxX = center.x + resolution * size.width / 2;
  var maxY = center.y + resolution * size.height / 2;
  return [minX, maxX, minY, maxY];
};


/**
 * @inheritDoc
 */
ol.View3D.prototype.getProjection = function() {
  return /** @type {ol.Projection|undefined} */ (
      this.get(ol.View3DProperty.PROJECTION));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getProjection',
    ol.View3D.prototype.getProjection);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getResolution = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View3DProperty.RESOLUTION));
};
goog.exportProperty(
    ol.View3D.prototype,
    'getResolution',
    ol.View3D.prototype.getResolution);


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 * @return {number} Resolution.
 */
ol.View3D.prototype.getResolutionForExtent = function(extent, size) {
  var xResolution = (extent[1] - extent[0]) / size.width;
  var yResolution = (extent[3] - extent[2]) / size.height;
  return Math.max(xResolution, yResolution);
};


/**
 * @return {number} Map rotation.
 */
ol.View3D.prototype.getRotation = function() {
  return /** @type {number|undefined} */ (
      this.get(ol.View3DProperty.ROTATION)) || 0;
};
goog.exportProperty(
    ol.View3D.prototype,
    'getRotation',
    ol.View3D.prototype.getRotation);


/**
 * @inheritDoc
 */
ol.View3D.prototype.getView2DState = function() {
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
ol.View3D.prototype.getView3D = function() {
  return this;
};


/**
 * @inheritDoc
 */
ol.View3D.prototype.getView2D = function() {
  var view2d = this._view2d;
  var cartographicCoord =
      /**@type{ol.Coordinate}**/
      ol.ellipsoid.WGS84.cartesianToCartographic(this.getCenter());
  var cartesian = this.getProjection().project(ol.ellipsoid.WGS84,
      cartographicCoord);

  view2d.setCenter(cartesian);
  view2d.setResolution(cartesian[2] / ol.DEFAULT_TILE_SIZE);
  return view2d;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Box pixel size.
 */
ol.View3D.prototype.fitExtent = function(extent, size) {
  this.setCenter(ol.extent.getCenter(extent));
  var resolution = this.getResolutionForExtent(extent, size);
  resolution = this.constraints_.resolution(resolution, 0, 0);
  this.setResolution(resolution);
};


/**
 * @return {boolean} Is defined.
 */
ol.View3D.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) &&
      goog.isDef(this.getResolution());
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 */
ol.View3D.prototype.setCenter = function(center) {
  this.set(ol.View3DProperty.CENTER, center);
};
goog.exportProperty(
    ol.View3D.prototype,
    'setCenter',
    ol.View3D.prototype.setCenter);


/**
 * @param {ol.Projection|undefined} projection Projection.
 */
ol.View3D.prototype.setProjection = function(projection) {
  this.set(ol.View3DProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.View3D.prototype,
    'setProjection',
    ol.View3D.prototype.setProjection);


/**
 * @param {number|undefined} resolution Resolution.
 */
ol.View3D.prototype.setResolution = function(resolution) {
  this.set(ol.View3DProperty.RESOLUTION, resolution);
};
goog.exportProperty(
    ol.View3D.prototype,
    'setResolution',
    ol.View3D.prototype.setResolution);


/**
 * @param {number|undefined} rotation Rotation.
 */
ol.View3D.prototype.setRotation = function(rotation) {
  this.set(ol.View3DProperty.ROTATION, rotation);
};
goog.exportProperty(
    ol.View3D.prototype,
    'setRotation',
    ol.View3D.prototype.setRotation);


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 */
ol.View3D.prototype.rotate = function(map, rotation, opt_anchor) {
  rotation = this.constraints_.rotation(rotation, 0);
  if (goog.isDefAndNotNull(opt_anchor)) {
    var anchor = opt_anchor;
    var oldCenter = /** @type {!ol.Coordinate} */ (this.getCenter());
    var center = [oldCenter[0] - anchor[0], oldCenter[1] - anchor[1]];
    ol.coordinate.rotate(center, rotation - this.getRotation());
    center.x += anchor.x;
    center.y += anchor.y;
    map.withFrozenRendering(function() {
      this.setCenter(center);
      this.setRotation(rotation);
    }, this);
  } else {
    this.setRotation(rotation);
  }
};


/**
 * @private
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 */
ol.View3D.prototype.zoom_ = function(map, resolution, opt_anchor) {
  if (goog.isDefAndNotNull(resolution) && goog.isDefAndNotNull(opt_anchor)) {
    var anchor = opt_anchor;
    var oldCenter = /** @type {!ol.Coordinate} */ (this.getCenter());
    var oldResolution = this.getResolution();
    var x = anchor.x - resolution * (anchor.x - oldCenter.x) / oldResolution;
    var y = anchor.y - resolution * (anchor.y - oldCenter.y) / oldResolution;
    var center = [x, y];
    map.withFrozenRendering(function() {
      this.setCenter(center);
      this.setResolution(resolution);
    }, this);
  } else {
    this.setResolution(resolution);
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_direction Zooming direction; > 0 indicates
 *     zooming out, in which case the constraints system will select
 *     the largest nearest resolution; < 0 indicates zooming in, in
 *     which case the constraints system will select the smallest
 *     nearest resolution; == 0 indicates that the zooming direction
 *     is unknown/not relevant, in which case the constraints system
 *     will select the nearest resolution. If not defined 0 is
 *     assumed.
 */
ol.View3D.prototype.zoom =
    function(map, resolution, opt_anchor, opt_duration, opt_direction) {
  var direction = opt_direction || 0;
  resolution = this.constraints_.resolution(resolution, 0, direction);
  this.zoomWithoutConstraints(map, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
ol.View3D.prototype.zoomWithoutConstraints =
    function(map, resolution, opt_anchor, opt_duration) {
  if (goog.isDefAndNotNull(resolution)) {
    var currentResolution = this.getResolution();
    var currentCenter = this.getCenter();
    if (goog.isDef(currentResolution) && goog.isDef(currentCenter) &&
        goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.zoom({
        resolution: currentResolution,
        duration: opt_duration,
        easing: ol.easing.easeOut
      }));
      if (goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({
          source: currentCenter,
          duration: opt_duration,
          easing: ol.easing.easeOut
        }));
      }
    }
    if (goog.isDefAndNotNull(opt_anchor)) {
      var anchor = opt_anchor;
      var oldCenter = /** @type {!ol.Coordinate} */ (this.getCenter());
      var oldResolution = this.getResolution();
      var x = anchor[0] - resolution *
          (anchor[0] - oldCenter[0]) / oldResolution;
      var y = anchor[1] - resolution *
          (anchor[1] - oldCenter[1]) / oldResolution;
      var center = [x, y];
      map.withFrozenRendering(function() {
        this.setCenter(center);
        this.setResolution(resolution);
      }, this);
    } else {
      this.setResolution(resolution);
    }
  }
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 */
ol.View3D.prototype.zoomToResolution = function(map, resolution, opt_anchor) {
  resolution = this.constraints_.resolution(resolution, 0, 0);
  this.zoom_(map, resolution, opt_anchor);
};


/**
 * @private
 * @param {ol.View3DOptions} view3DOptions View3D options.
 * @return {ol.Constraints} Constraints.
 */
ol.View3D.createConstraints_ = function(view3DOptions) {
  var resolutionConstraint;
  if (goog.isDef(view3DOptions.resolutions)) {
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        view3DOptions.resolutions);
  } else {
    var maxResolution, numZoomLevels, zoomFactor;
    if (goog.isDef(view3DOptions.maxResolution) &&
        goog.isDef(view3DOptions.numZoomLevels) &&
        goog.isDef(view3DOptions.zoomFactor)) {
      maxResolution = view3DOptions.maxResolution;
      numZoomLevels = view3DOptions.numZoomLevels;
      zoomFactor = view3DOptions.zoomFactor;
    } else {
      var projectionExtent = ol.projection.createProjection(
          view3DOptions.projection, 'EPSG:3857').getExtent();
      maxResolution = Math.max(
          projectionExtent[1] - projectionExtent[0],
          projectionExtent[3] - projectionExtent[2]) / ol.DEFAULT_TILE_SIZE;
      // number of steps we want between two data resolutions
      var numSteps = 4;
      numZoomLevels = 29 * numSteps;
      zoomFactor = Math.exp(Math.log(2) / numSteps);
    }
    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(
        zoomFactor, maxResolution, numZoomLevels - 1);
  }
  // FIXME rotation constraint is not configurable at the moment
  var rotationConstraint = ol.RotationConstraint.none;
  return new ol.Constraints(resolutionConstraint, rotationConstraint);
};
