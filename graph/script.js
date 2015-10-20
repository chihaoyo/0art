var makeNode = function(id, parent) {
  return {
    data: {id: id, parent: parent}
  };
};
var makeEdge = function(id, source, target) {
  return {
    data: {id: id, source: source, target: target}
  };
};

var nodes = [
  makeNode('a', 'b'),
  makeNode('b'),
  makeNode('c', 'b'),
  makeNode('d'),
  makeNode('e'),
  makeNode('f', 'e'),
  makeNode('clkao'),
];
var edges = [
  makeEdge('ad', 'a', 'd'),
  makeEdge('eb', 'e', 'b'),
];

var fontFamily = '"PingFang TC", "Helvetica Neue", sans-serif';
var fontSize = '11px';
var fontWeight = '300';
var highlightColor = 'lime';
var cy;

$(function(){ // on dom ready

cy = cytoscape({
  container: document.getElementById('cy'),
  style: [
    {
      selector: 'node',
      css: {
        'content': 'data(id)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': fontFamily,
        'font-size': fontSize,
        'font-weight': fontWeight,
      }
    },
    {
      selector: '$node > node',
      css: {
        'padding-top': '10px',
        'padding-left': '10px',
        'padding-bottom': '10px',
        'padding-right': '10px',
        'text-valign': 'top',
        'text-halign': 'center',
      }
    },
    {
      selector: 'edge',
      css: {
        'content': 'data(id)',
        'edge-text-rotation': 'autorotate',
        'target-arrow-shape': 'triangle',
        'font-family': fontFamily,
        'font-size': fontSize,
        'font-weight': fontWeight,
      }
    },
    {
      selector: ':selected',
      css: {
        'background-color': highlightColor,
        'line-color': highlightColor,
        'target-arrow-color': highlightColor,
        'source-arrow-color': highlightColor,
      }
    }
  ],

  elements: {
    nodes: nodes,
    edges: edges,
  },
  layout: {
    name: 'cose',
    padding: 2,
  },
  pixelRatio: 2,
  wheelSensitivity: -1,
});

}); // on dom ready
