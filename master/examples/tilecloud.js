var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.XYZ({
        crossOrigin: 'anonymous',
        maxZoom: 8,
        opaque: true,
        url: 'http://localhost:8080/tiles/0/tiles/{z}/{x}/{y}'
      })
    }),
    new ol.layer.TileLayer({
      source: new ol.source.XYZ({
        crossOrigin: 'anonymous',
        maxZoom: 22,
        url: 'http://localhost:8080/tiles/1/tiles/{z}/{x}/{y}'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
