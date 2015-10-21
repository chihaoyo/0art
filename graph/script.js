function guidGenerator() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};
// live at http://jsbin.com/wahuto/6/edit?js,output -- 2015/10/21
var NTYPES = {
  person: 'person',
  organization: 'organization',
  project: 'project',
  document: 'document',
  event: 'event',
};
var NCOLORS = {
  person: {text: 'blue', background: 'aqua'},
  organization: {text: 'aqua', background: 'blue'},
  project: {text: 'blue', background: 'lime'},
  document: {text: 'black', background: 'grey'},
  event: {text: 'blue', background: 'yellow'},
};
var ETYPES = {
  contribute: '貢獻',
  participate: '參與',
  attend: '出席',
  host: '主辦',
};

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

var addPerson = function() { // personID [organizationID...]
  var args = [].slice.call(arguments);
  var personID = args.shift();
  addNode(personID, NTYPES.person);
  for(i in args) {
    var organizationID = args[i];
    addOrganization(organizationID);
    addParticipate(personID, organizationID);
  }
};
var addOrganization = function() { // organizationID [personID...]
  var args = [].slice.call(arguments);
  var organizationID = args.shift();
  addNode(organizationID, NTYPES.organization);
  for(i in args) {
    var personID = args[i];
    addPerson(personID);
    addParticipate(personID, organizationID);
  }
};
var addParticipate = function(source, target) {
  addPerson(source);
  addOrganization(target);
  addEdge(source, target, ETYPES.participate);
};

var addProject = function() { // projectID [personID...]
  var args = [].slice.call(arguments);
  var projectID = args.shift();
  addNode(projectID, NTYPES.project);
  for(i in args) {
    var personID = args[i];
    addPerson(personID);
    addContribute(personID, projectID);
  }
};
var addContribute = function() { // personID projectID [projectID...]
  var args = [].slice.call(arguments);
  var source = args.shift();
  addPerson(source);
  for(i in args) {
    var target = args[i];
    addProject(target);
    addEdge(source, target, ETYPES.contribute);
  }
};

var addEvent = function() { // eventID [personID...]
  var args = [].slice.call(arguments);
  var eventID = args.shift();
  addNode(projectID, NTYPES.event);
  for(i in args) {
    var personID = args[i];
    addPerson(personID);
    addAttend(personID, eventID);
  }
};
var addAttend = function() { // personID [eventID...]
  var args = [].slice.call(arguments);
  var personID = args.shift();
  addPerson(personID);
  for(i in args) {
    var eventID = args[i];
    addEvent(eventID);
    addEdge(personID, eventID, ETYPES.attend);
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
var defaultOpacity = 0.5;
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
      'target-arrow-shape': 'triangle',
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
for(n in NTYPES) {
  styles.push({
    selector: 'node.' + NTYPES[n],
    css: {
      'color': NCOLORS[n].text,
      'background-color': NCOLORS[n].background,
    },
  });
};

var cy;
var $control;
$(function(){ // on dom ready

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

_f = new Firebase('https://0art.firebaseio.com/');
_f.child('elements').on('child_added', function(s) {
  var element = s.val();
  console.log('child_added', element);
  if(cy.$('[id="' + element.data.id + '"]').length <= 0) // use [id="elementID"] to make Unicode id work
    cy.add(element);
});
_f.child('elements').on('value', function(s) {
  console.log('value');
  cy.layout();
});

$control = $('#control');
$nodeTypeSwitch = $('<div id="nodeTypeSwitch">').appendTo($control);
for(n in NTYPES) {
  var classes = 'nodeType ' + NTYPES[n];
  $('<div>').html('<label>' + n + '</label>')
    .addClass(classes).css({backgroundColor: NCOLORS[n].background, color: NCOLORS[n].text})
    .appendTo($nodeTypeSwitch)
    .click(function() { $(this).addClass('active').siblings().removeClass('active'); });
}


}); // on dom ready
