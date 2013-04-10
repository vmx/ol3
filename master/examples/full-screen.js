var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var view = new ol.View2D();

var map = new ol.Map({
  layers: [layer],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: view
});

var mapSize = map.getSize();
if (mapSize) {
  view.fitExtent(view.getProjection().getExtent(), mapSize);
}
