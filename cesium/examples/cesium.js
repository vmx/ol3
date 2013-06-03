/*var view = new ol.View3D({
  center: [26415645.342789244, 0, 0],
  direction : [-1, 0, 0],
  up : [0, 0, 1],
  right : [0, 1, 0],
  zoom: 1
});
var cesium = new ol.Map({
    layers: new ol.Collection([layer]),
    target: 'cesium',
    view : view,
    renderer: ol.RendererHint.CESIUM
  });

var map = new ol.Map({
  target: 'ol3',
  renderer: ol.RendererHint.WEBGL
});


map.bindTo('layers', cesium);
map.bindTo('view', cesium)*/

var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.WEBGL,
  target: 'ol3',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

var cesium = new ol.Map({
  target: 'cesium',
  renderer: ol.RendererHint.CESIUM
});

cesium.bindTo('layers', map);
cesium.bindTo('view', map);
