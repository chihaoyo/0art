function guidGenerator() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};
// 節點的種類
var NODETYPES = {
  person: { label: '人', colors: {text: 'blue', background: 'aqua'} },
  organization: { label: '組織', colors: {text: 'aqua', background: 'blue'} },
  project: { label: '坑', colors: {text: 'blue', background: 'lime'} },
  document: { label: '文件', colors: {text: 'black', background: 'grey'} },
  event: { label: '事件', colors: {text: 'blue', background: 'yellow'} },
};
// 連結的種類
var EDGETYPES = {
  contribute: { label: '貢獻', source: 'person', target: 'project' },
  participate: { label: '參與', source: 'person', target: 'organization' },
  attend: { label: '出席', source: 'person', target: 'event' },
  compose: { label: '撰寫', source: 'person', target: 'document' },
  generate: { label: '產生', source: 'project', target: 'document' },
};

// 資料庫
var addNode = function(id, type, parent) {
  if(cy.$('node[id="' + id + '"]').length > 0)
    return -1; // check for duplicates
  _f.child('elements').push({
    group: 'nodes',
    data: {id: id}, // ignoring parent
    classes: type
  });
};
var addEdge = function(source, target, label) {
  if(cy.$('edge[source="' + source + '"][target="' + target+ '"][label="' + label + '"]').length > 0)
    return -1; // check for duplicates
  _f.child('elements').push({
    group: 'edges',
    data: {id: guidGenerator(), source: source, target: target, label: label},
  });
};

// 建立多對多的連結
/*
[person] contribute [project]
[person] participate [organization]
[person] attend [event]
[person] compose [document]
[project] generate [document]
*/
var connectDir = function(type0, idList0, label, type1, idList1) {
  for(i in idList0) {
    for(j in idList1) {
      var id0 = idList0[i];
      var id1 = idList1[j];

      addNode(id0, type0)
      addNode(id1, type1);
      addEdge(id0, id1, label);
    }
  }
};

// graph data
var _f;
var nodes = [];
var edges = [];

// styles
var fontFamily = '"PingFang TC", "Helvetica Neue", sans-serif';
var fontSize = 11;
var fontWeight = 300;
var defaultColor = '#aaa';
var highlightColor = 'black';
var defaultOpacity = 0.25;
var highlightOpacity = 1.0;
var styles = [
  {
    selector: 'node',
    css: {
      'content': 'data(id)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': fontFamily,
      'font-size': fontSize,
      'font-weight': fontWeight,
      'width': fontSize*2,
      'height': fontSize*2,
      'background-color': defaultColor,
      'background-opacity': defaultOpacity,
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
      'background-color': '#ddd',
      'background-opacity': defaultOpacity,
    }
  },
  {
    selector: 'edge',
    css: {
      'content': 'data(label)',
      'edge-text-rotation': 'autorotate',
      'line-color': defaultColor,
      'target-arrow-color': defaultColor,
      'target-arrow-shape': 'none',
      'font-family': fontFamily,
      'font-size': fontSize,
      'font-weight': fontWeight,
    }
  },
  {
    selector: ':selected',
    css: {
      'background-opacity': 1,
      'line-color': highlightColor,
      'target-arrow-color': highlightColor,
    }
  }
];
// 每一種不同節點以不同顏色表示
for(type in NODETYPES) {
  styles.push({
    selector: 'node.' + type,
    css: {
      'color': NODETYPES[type].colors.text,
      'background-color': NODETYPES[type].colors.background,
    },
  });
};

var cy;
$(function(){ // start on-dom-ready

// initialize graph
cy = cytoscape({
  container: document.getElementById('cy'),
  style: styles,
  elements: {
    nodes: nodes,
    edges: edges,
  },
  layout: {
    name: 'cose',
    padding: 25,
  },
  pixelRatio: 2,
  wheelSensitivity: -1,
});

// connect to Firebase
_f = new Firebase('https://0art.firebaseio.com/');
_f.child('elements').on('child_added', function(s) {
  var element = s.val();
  //console.log('child_added', element);
  if(cy.$('[id="' + element.data.id + '"]').length <= 0) // use [id="elementID"] to make Unicode id work
    cy.add(element);
});
_f.child('elements').on('value', function(s) {
  console.log('value');
  cy.layout();
});

// configure interface
// make control draggable
var $control = $('#control').draggabilly();

// build legend
var $legend = $('#legend');
for(type in NODETYPES) {
  $('<div>').html('<label>' + NODETYPES[type].label + '</label>')
    .addClass('nodeType').attr('type', type).css({backgroundColor: NODETYPES[type].colors.background, color: NODETYPES[type].colors.text})
    .appendTo($legend);
}

// make interface to create new nodes and connect them
// #connect
var $toConnect = $('#connect');
var $textInputBoxes = $toConnect.find('input[type="text"]').on('mousedown mouseup mousemove', function(event) {event.stopPropagation();});
var $idList0 = $toConnect.find('[name="idList0"]');
var $idList1 = $toConnect.find('[name="idList1"]');
var $edgeType = $toConnect.find('[name="edgeType"]');
for(type in EDGETYPES) {
  $('<option>').text(EDGETYPES[type].label).attr('value', type).appendTo($edgeType);
}
$edgeType.change(function() {
  // 根據不同的連結種類提示不同的接點種類
  var type = $edgeType.val();
  var sourceLabel = NODETYPES[EDGETYPES[type].source].label;
  var targetLabel = NODETYPES[EDGETYPES[type].target].label;
  $idList0.attr('placeholder', [sourceLabel,sourceLabel,sourceLabel].join(',')+'⋯');
  $idList1.attr('placeholder', [targetLabel,targetLabel,targetLabel].join(',')+'⋯');
});
$edgeType.change();

var inputFilter = function(input) { return input; }; // eliminate empty elments
var inputEditor = function(input) { // format input
  return input.replace(/\s+/g, '_'); // replace whitespaces to underscores
};
var $connect = $toConnect.find('[name="connect"]').click(function() {
  var idList0 = $idList0.val().trim().split(/\s*,\s*/).filter(inputFilter).map(inputEditor);
  var idList1 = $idList1.val().trim().split(/\s*,\s*/).filter(inputFilter).map(inputEditor);
  var edgeType = $edgeType.val();
  var type0 = EDGETYPES[edgeType].source;
  var type1 = EDGETYPES[edgeType].target;
  var label = EDGETYPES[edgeType].label;
  console.log(type0, idList0, label, type1, idList1);
  connectDir(type0, idList0, label, type1, idList1);
  return false;
});
var $clear = $toConnect.find('[name="clear"]').click(function() {
  $textInputBoxes.val('');
  $edgeType[0].selectedIndex = 0;
  $edgeType.change();
});

}); // end on-dom-ready
