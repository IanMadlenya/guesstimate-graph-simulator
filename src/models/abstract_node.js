var Backbone = require('backbone');
var numeral = require('numeral');
var _ = require('lodash');

class AbstractGroup {
  constructor(node, graph) {
    this.node = node;
    this.graph = graph;
  }
  edges() {
    return _.filter(this._allEdges().models, function(n){ return n.get(this.goTo) === this.node.id; }, this);
  }
  getEdge(nodeId) {
    return _.find(this.edges(), function(n){ return n.get(this.getFrom) === nodeId; }, this);
  }
  getEdges(nodeIds) {
    return _.map(nodeIds, function(nodeId){ return this.getEdge(nodeId); }, this);
  }
  nodeIds() {
    return _.map(this.nodes(), function(i){return i.id; });
  }
  createEdge(nodeId) {
    var newObject = {};
    newObject[this.goTo] = this.node.id;
    newObject[this.getFrom] = nodeId;
    return this._allEdges().create(newObject);
  }
  _allEdges() { return this.graph.edges; }
}

class Outputs extends AbstractGroup {
  constructor(node, edges) {
    super(node, edges);
    this.getFrom = 1;
    this.goTo = 0;
  }
  nodes() {
    return _.map(this.edges(), function(e){ return e.outputNode; });
  }
}

class Inputs extends AbstractGroup {
  constructor(node, edges) {
    super(node, edges);
    this.getFrom = 0;
    this.goTo = 1;
  }
  nodes() {
    return _.map(this.edges(), function(e){ return e.inputNode; });
  }
}

class AbstractNode extends Backbone.Model {

  defaults() {
  }

  setup() {
  }

  initialize(attributes) {
    this.id = attributes.pid;
    this.outputs = new Outputs(this, this.collection.graph);
    this.inputs = new Inputs(this, this.collection.graph);
    this.setup();
  }

  remove() {
    var edges = this.edges();
    edges.map(e => e.destroy());
    this.destroy();
  }

  inputEdges() {
  }

  outputEdges() {
  }

  edges() {
    return _.union(this.inputs.edges(), this.outputs.edges());
  }

  inputValues() {
    return _.map(this.inputs.nodes(), function(i){ return i.get('value'); });
  }

  allOutputs() {
    var outputs = this.outputs.nodes();
    var furtherOutputs = _.map(outputs, function(e){return e.allOutputs(); });
    return _.flatten([outputs, furtherOutputs]);
    //return outputs;
  }

  toCytoscape() {
    var e = {};
    e.nodeId = this.id;
    e.nodeType = this.attributes.nodeType;
    _.merge(e, this.attributes);
    e.id = 'n' + this.id; // Nodes need letters for cytoscape
    e.name = this.toCytoscapeName();

    if (e.position === undefined) {
      e.position = { x: ( Math.random() * 50 ), y: ( Math.random() * 50 ) };
    }

    if (!e.name){ e.name = 'Add Name'; }
    return {data: e, position: e.position};
  }

  formatValue() {
    var value = parseFloat(this.get('value'));
    if (value > 10){
      return numeral(value).format('0.0a');
    }
    else {
      return value.toPrecision(2);
    }
  }

  toCytoscapeName() {
    var name = this.get('name');
    var value = this.formatValue();
    var totalName = null;

    if (value && name) {
      totalName = value + ' - ' + name;
    }
    else if (value || name) {
      totalName = value || name;
    }
    return totalName;
  }
}

module.exports = AbstractNode;
