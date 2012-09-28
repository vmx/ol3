// FIXME rotation constraint is not configurable at the moment
// FIXME MapOptions should create a Zoom control

goog.provide('ol.MapOptions');
goog.provide('ol.MapOptionsLiteral');
goog.provide('ol.MapOptionsType');
goog.provide('ol.RendererHint');

goog.require('ol.Collection');
goog.require('ol.Constraints');
goog.require('ol.Projection');
goog.require('ol.ResolutionConstraint');
goog.require('ol.RotationConstraint');
goog.require('ol.control.Attribution');
goog.require('ol.control.Zoom');
goog.require('ol.interaction.AltDragRotate');
goog.require('ol.interaction.DblClickZoom');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.KeyboardPan');
goog.require('ol.interaction.KeyboardZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.interaction.ShiftDragZoom');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.dom');
goog.require('ol.renderer.dom.Map');
goog.require('ol.renderer.webgl');
goog.require('ol.renderer.webgl.Map');


/**
 * @define {boolean} Whether to enable DOM.
 */
ol.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol.ENABLE_WEBGL = true;


/**
 * @enum {string}
 */
ol.RendererHint = {
  DOM: 'dom',
  WEBGL: 'webgl'
};


/**
 * @type {Array.<ol.RendererHint>}
 */
ol.DEFAULT_RENDERER_HINTS = [
  ol.RendererHint.WEBGL,
  ol.RendererHint.DOM
];


/**
 * @typedef {{center: (ol.Coordinate|undefined),
 *            controls: (ol.Collection|undefined),
 *            doubleClickZoom: (boolean|undefined),
 *            dragPan: (boolean|undefined),
 *            interactions: (ol.Collection|undefined),
 *            keyboard: (boolean|undefined),
 *            keyboardPanOffset: (number|undefined),
 *            layers: (ol.Collection|undefined),
 *            maxResolution: (number|undefined),
 *            mouseWheelZoom: (boolean|undefined),
 *            mouseWheelZoomDelta: (number|undefined),
 *            numZoomLevels: (number|undefined),
 *            projection: (ol.Projection|string|undefined),
 *            renderer: (ol.RendererHint|undefined),
 *            renderers: (Array.<ol.RendererHint>|undefined),
 *            resolution: (number|undefined),
 *            resolutions: (Array.<number>|undefined),
 *            rotate: (boolean|undefined),
 *            shiftDragZoom: (boolean|undefined),
 *            userProjection: (ol.Projection|string|undefined),
 *            zoom: (number|undefined),
 *            zoomDelta: (number|undefined),
 *            zoomFactor: (number|undefined)}}
 */
ol.MapOptionsLiteral;


/**
 * @typedef {{controls: ol.Collection,
 *            constraints: ol.Constraints,
 *            rendererConstructor:
 *                function(new: ol.renderer.Map, Element, ol.Map),
 *            values: Object.<string, *>}}
 */
ol.MapOptionsType;


/**
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options.
 * @return {ol.MapOptionsType} Map options.
 */
ol.MapOptions.create = function(mapOptionsLiteral) {

  /**
   * @type {Object.<string, *>}
   */
  var values = {};

  if (goog.isDef(mapOptionsLiteral.center)) {
    values[ol.MapProperty.CENTER] = mapOptionsLiteral.center;
  }

  values[ol.MapProperty.INTERACTIONS] =
      goog.isDef(mapOptionsLiteral.interactions) ?
      mapOptionsLiteral.interactions :
      ol.MapOptions.createInteractions_(mapOptionsLiteral);

  values[ol.MapProperty.LAYERS] = goog.isDef(mapOptionsLiteral.layers) ?
      mapOptionsLiteral.layers : new ol.Collection();

  values[ol.MapProperty.PROJECTION] = ol.MapOptions.createProjection_(
      mapOptionsLiteral.projection, 'EPSG:3857');

  if (goog.isDef(mapOptionsLiteral.resolution)) {
    values[ol.MapProperty.RESOLUTION] = mapOptionsLiteral.resolution;
  } else if (goog.isDef(mapOptionsLiteral.zoom)) {
    values[ol.MapProperty.RESOLUTION] =
        ol.Projection.EPSG_3857_HALF_SIZE / (128 << mapOptionsLiteral.zoom);
  }

  values[ol.MapProperty.USER_PROJECTION] = ol.MapOptions.createProjection_(
      mapOptionsLiteral.userProjection, 'EPSG:4326');

  /**
   * @type {function(new: ol.renderer.Map, Element, ol.Map)}
   */
  var rendererConstructor = ol.renderer.Map;

  /**
   * @type {Array.<ol.RendererHint>}
   */
  var rendererHints;
  if (goog.isDef(mapOptionsLiteral.renderers)) {
    rendererHints = mapOptionsLiteral.renderers;
  } else if (goog.isDef(mapOptionsLiteral.renderer)) {
    rendererHints = [mapOptionsLiteral.renderer];
  } else {
    rendererHints = ol.DEFAULT_RENDERER_HINTS;
  }

  var i, rendererHint;
  for (i = 0; i < rendererHints.length; ++i) {
    rendererHint = rendererHints[i];
    if (rendererHint == ol.RendererHint.DOM) {
      if (ol.ENABLE_DOM && ol.renderer.dom.isSupported()) {
        rendererConstructor = ol.renderer.dom.Map;
        break;
      }
    } else if (rendererHint == ol.RendererHint.WEBGL) {
      if (ol.ENABLE_WEBGL && ol.renderer.webgl.isSupported()) {
        rendererConstructor = ol.renderer.webgl.Map;
        break;
      }
    }
  }

  /**
   * @type {ol.Constraints}
   */
  var constraints = ol.MapOptions.createConstraints_(mapOptionsLiteral);

  /**
   * @type {ol.Collection}
   */
  var controls;
  if (goog.isDef(mapOptionsLiteral.controls)) {
    controls = mapOptionsLiteral.controls;
  } else {
    controls = ol.MapOptions.createControls_(mapOptionsLiteral);
  }

  return {
    constraints: constraints,
    controls: controls,
    rendererConstructor: rendererConstructor,
    values: values
  };

};


/**
 * @private
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options literal.
 * @return {ol.Constraints} Map constraints.
 */
ol.MapOptions.createConstraints_ = function(mapOptionsLiteral) {
  var resolutionConstraint;
  if (goog.isDef(mapOptionsLiteral.resolutions)) {
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
        mapOptionsLiteral.resolutions);
  } else {
    var maxResolution, numZoomLevels, zoomFactor;
    if (goog.isDef(mapOptionsLiteral.maxResolution) &&
        goog.isDef(mapOptionsLiteral.numZoomLevels) &&
        goog.isDef(mapOptionsLiteral.zoomFactor)) {
      maxResolution = mapOptionsLiteral.maxResolution;
      numZoomLevels = mapOptionsLiteral.numZoomLevels;
      zoomFactor = mapOptionsLiteral.zoomFactor;
    } else {
      maxResolution = ol.Projection.EPSG_3857_HALF_SIZE / 128;
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


/**
 * @private
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options literal.
 * @return {ol.Collection} Controls.
 */
ol.MapOptions.createControls_ = function(mapOptionsLiteral) {

  var controls = new ol.Collection();

  controls.push(new ol.control.Attribution({}));

  var zoomDelta = goog.isDef(mapOptionsLiteral.zoomDelta) ?
      mapOptionsLiteral.zoomDelta : 4;
  controls.push(new ol.control.Zoom({
    delta: zoomDelta
  }));

  return controls;

};


/**
 * @private
 * @param {ol.MapOptionsLiteral} mapOptionsLiteral Map options literal.
 * @return {ol.Collection} Interactions.
 */
ol.MapOptions.createInteractions_ = function(mapOptionsLiteral) {

  var interactions = new ol.Collection();

  var rotate = goog.isDef(mapOptionsLiteral.rotate) ?
      mapOptionsLiteral.rotate : true;
  if (rotate) {
    interactions.push(new ol.interaction.AltDragRotate());
  }

  var doubleClickZoom = goog.isDef(mapOptionsLiteral.doubleClickZoom) ?
      mapOptionsLiteral.doubleClickZoom : true;
  if (doubleClickZoom) {
    var zoomDelta = goog.isDef(mapOptionsLiteral.zoomDelta) ?
        mapOptionsLiteral.zoomDelta : 4;
    interactions.push(new ol.interaction.DblClickZoom(zoomDelta));
  }

  var dragPan = goog.isDef(mapOptionsLiteral.dragPan) ?
      mapOptionsLiteral.dragPan : true;
  if (dragPan) {
    interactions.push(new ol.interaction.DragPan());
  }

  var keyboard = goog.isDef(mapOptionsLiteral.keyboard) ?
      mapOptionsLiteral.keyboard : true;
  var keyboardPanOffset = goog.isDef(mapOptionsLiteral.keyboardPanOffset) ?
      mapOptionsLiteral.keyboardPanOffset : 80;
  if (keyboard) {
    interactions.push(new ol.interaction.KeyboardPan(keyboardPanOffset));
    interactions.push(new ol.interaction.KeyboardZoom());
  }

  var mouseWheelZoom = goog.isDef(mapOptionsLiteral.mouseWheelZoom) ?
      mapOptionsLiteral.mouseWheelZoom : true;
  if (mouseWheelZoom) {
    var mouseWheelZoomDelta =
        goog.isDef(mapOptionsLiteral.mouseWheelZoomDelta) ?
            mapOptionsLiteral.mouseWheelZoomDelta : 1;
    interactions.push(new ol.interaction.MouseWheelZoom(mouseWheelZoomDelta));
  }

  var shiftDragZoom = goog.isDef(mapOptionsLiteral.shiftDragZoom) ?
      mapOptionsLiteral.shiftDragZoom : true;
  if (shiftDragZoom) {
    interactions.push(new ol.interaction.ShiftDragZoom());
  }

  return interactions;

};


/**
 * @private
 * @param {ol.Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {ol.Projection} Projection.
 */
ol.MapOptions.createProjection_ = function(projection, defaultCode) {
  if (!goog.isDefAndNotNull(projection)) {
    return ol.Projection.getFromCode(defaultCode);
  } else if (goog.isString(projection)) {
    return ol.Projection.getFromCode(projection);
  } else {
    goog.asserts.assert(projection instanceof ol.Projection);
    return projection;
  }
};