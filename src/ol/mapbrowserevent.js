goog.provide('ol.MapBrowserEvent');
goog.provide('ol.MapBrowserEvent.EventType');
goog.provide('ol.MapBrowserEventHandler');

goog.require('goog.asserts');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 */
ol.MapBrowserEvent = function(type, map, browserEvent) {

  goog.base(this, type, map);

  /**
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @private
   * @type {ol.Coordinate|undefined}
   */
  this.coordinate_ = undefined;

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * @return {ol.Coordinate|undefined} Coordinate.
 */
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isDef(this.coordinate_)) {
    return this.coordinate_;
  } else {
    var map = this.map;
    var browserEvent = this.browserEvent;
    var eventPosition = goog.style.getRelativePosition(
        browserEvent, map.getViewport());
    var pixel = new ol.Pixel(eventPosition.x, eventPosition.y);
    var coordinate = map.getCoordinateFromPixel(pixel);
    this.coordinate_ = coordinate;
    return coordinate;
  }
};


/**
 * @return {boolean} Do we have a left click?
 */
ol.MapBrowserEvent.prototype.isMouseActionButton = function() {
  // always assume a left-click on touch devices
  return ('ontouchstart' in document.documentElement) ||
      this.browserEvent.isMouseActionButton();
};



/**
 * @param {ol.Map} map The map with the viewport to listen to events on.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.MapBrowserEventHandler = function(map) {

  /**
   * This is the element that we will listen to the real events on.
   * @type {ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {Object}
   * @private
   */
  this.previous_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.dragged_ = false;

  /**
   * @type {number}
   * @private
   */
  this.timestamp_ = 0;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = null;

  /**
   * @type {goog.events.BrowserEvent}
   * @private
   */
  this.down_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.isTouch_ = document && ('ontouchstart' in document.documentElement);

  var element = this.map_.getViewport();
  goog.events.listen(element,
      this.isTouch_ ?
          goog.events.EventType.TOUCHSTART :
          goog.events.EventType.MOUSEDOWN,
      this.dragstart_, false, this);
  goog.events.listen(element,
      this.isTouch_ ?
          goog.events.EventType.TOUCHEND :
          goog.events.EventType.MOUSEUP,
      this.dblclick_, false, this);
  goog.events.listen(element,
      goog.events.EventType.CLICK, this.click_, false, this);
};
goog.inherits(ol.MapBrowserEventHandler, goog.events.EventTarget);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.touchEnableBrowserEvent_ =
    function(browserEvent) {
  if (this.isTouch_) {
    goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
    var nativeEvent = browserEvent.getBrowserEvent();
    if (nativeEvent.touches && nativeEvent.touches.length) {
      var nativeTouch = nativeEvent.touches[0];
      browserEvent.clientX = nativeTouch.clientX;
      browserEvent.clientY = nativeTouch.clientY;
    }
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.click_ = function(browserEvent) {
  if (!this.dragged_) {
    this.touchEnableBrowserEvent_(browserEvent);
    var newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.CLICK, this.map_, browserEvent);
    this.down_ = null;
    this.dispatchEvent(newEvent);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.dblclick_ = function(browserEvent) {
  if (!this.dragged_) {
    var now = new Date().getTime();
    if (!this.timestamp_ || now - this.timestamp_ > 250) {
      this.timestamp_ = now;
    } else {
      this.timestamp_ = 0;
      this.touchEnableBrowserEvent_(this.down_);
      var newEvent = new ol.MapBrowserEvent(
          ol.MapBrowserEvent.EventType.DBLCLICK, this.map_, this.down_);
      this.down_ = null;
      this.dispatchEvent(newEvent);
    }
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.dragstart_ = function(browserEvent) {
  if (!this.previous_) {
    this.down_ = new goog.events.BrowserEvent(browserEvent.getBrowserEvent());
    this.touchEnableBrowserEvent_(browserEvent);
    this.previous_ = {
      clientX: browserEvent.clientX,
      clientY: browserEvent.clientY
    };
    this.dragged_ = false;
    this.dragListenerKeys_ = [
      goog.events.listen(document,
          this.isTouch_ ?
              goog.events.EventType.TOUCHMOVE :
              goog.events.EventType.MOUSEMOVE,
          this.drag_, false, this),
      goog.events.listen(document,
          this.isTouch_ ?
              goog.events.EventType.TOUCHEND :
              goog.events.EventType.MOUSEUP,
          this.dragend_, false, this)
    ];
    var newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.DRAGSTART, this.map_, browserEvent);
    this.dispatchEvent(newEvent);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.drag_ = function(browserEvent) {
  this.dragged_ = true;
  this.touchEnableBrowserEvent_(browserEvent);
  this.previous_ = {
    clientX: browserEvent.clientX,
    clientY: browserEvent.clientY
  };
  // prevent viewport dragging on touch devices
  browserEvent.preventDefault();
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.DRAG, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.dragend_ = function(browserEvent) {
  if (this.previous_) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
    this.previous_ = null;
    var newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.DRAGEND, this.map_, browserEvent);
    this.down_ = null;
    this.dispatchEvent(newEvent);
  }
};


/** @override */
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  var element = this.map_.getViewport();
  goog.events.unlisten(element,
      this.isTouch_ ?
          goog.events.EventType.TOUCHSTART :
          goog.events.EventType.MOUSEDOWN,
      this.dragstart_, false, this);
  goog.events.unlisten(element,
      this.isTouch_ ?
          goog.events.EventType.TOUCHEND :
          goog.events.EventType.MOUSEUP,
      this.dblclick_, false, this);
  goog.events.unlisten(element,
      goog.events.EventType.CLICK, this.click_, false, this);
  goog.asserts.assert(goog.isDef(this.dragListenerKeys_));
  goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
  this.dragListenerKeys_ = null;
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {
  CLICK: goog.events.EventType.CLICK,
  DBLCLICK: goog.events.EventType.DBLCLICK,
  DRAGSTART: 'dragstart',
  DRAG: 'drag',
  DRAGEND: 'dragend'
};