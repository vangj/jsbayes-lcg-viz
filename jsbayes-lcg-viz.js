(function(window) {
  'use strict';
  var dagre, d3, jsbayeslcg;
  var OUT_LEFT = 1,
      OUT_TOP = 2,
      OUT_RIGHT = 4,
      OUT_BOTTOM = 8;
  var gwidth = 150,
      gheight = gwidth/2;
  
  function getPath(n1, n2) {
    var c1 = center(n1),
      c2 = center(n2);
    var x1 = c1.x,
      y1 = c1.y,
      x2 = c2.x,
      y2 = c2.y,
      theta = Math.atan2(y2 - y1, x2 - x1);
    var p1 = getPoint(theta, n1),
      p2 = getPoint(theta + Math.PI, n2);
    if (p1.error || p2.error) {
      return {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        error: true
      };
    }
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y
    };
  }
  function getPoint(theta, n) {
    var c = center(n);
    var cx = c.x;
    var cy = c.y;
    var w = n.width / 2.0;
    var h = n.height / 2.0;
    var d = distance(cx, cy, cx + w, cy + h);
    var x = cx + d * Math.cos(theta);
    var y = cy + d * Math.sin(theta);
    var ocode = outcode(n, x, y);
    var p = {};
    switch (ocode) {
      case OUT_TOP:
        p.x = cx - h * ((x - cx) / (y - cy));
        p.y = cy - h;
        break;
      case OUT_LEFT:
        p.x = cx - w;
        p.y = cy - w * ((y - cy) / (x - cx));
        break;
      case OUT_BOTTOM:
        p.x = cx + h * ((x - cx) / (y - cy));
        p.y = cy + h;
        break;
      case OUT_RIGHT:
        p.x = cx + w;
        p.y = cy + w * ((y - cy) / (x - cx));
        break;
      default:
        console.error('non-cardinal outcode ' + ocode);
        p.error = true;
    }
    return p;
  }
  function center(node) {
    var x = node.width / 2.0 + node.x,
      y = node.height / 2.0 + node.y;
    return {
      x: x,
      y: y
    };
  }
  function distance(x1, y1, x2, y2) {
    var x = x1 - x2;
    var y = y1 - y2;
    var d = Math.sqrt(x * x + y * y);
    return d;
  }
  function outcode(n, x, y) {
    var out = 0;
    if (n.width <= 0) {
      out |= OUT_LEFT | OUT_RIGHT;
    } else if (x < n.x) {
      out |= OUT_LEFT;
    } else if (x > n.x + n.width) {
      out |= OUT_RIGHT;
    }

    if (n.height <= 0) {
      out |= OUT_TOP | OUT_BOTTOM;
    } else if (y < n.y) {
      out |= OUT_TOP;
    } else if (y > n.y + n.height) {
      out |= OUT_BOTTOM;
    }
    return out;
  }
  function gaussian(x, mean, sigma) {
    var gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
    var xx = (x - mean) / sigma;
    return gaussianConstant * Math.exp(-.5 * xx * xx) / sigma;
  }
  function initNodeData(node) {
    var mean = node.mean;
    var sigma = (true === node.observed) ? 0.5 : node.sigma;
    var data = [];
    var lower = mean - (3.5 * sigma);
    var upper = mean + (3.5 * sigma);
    var increment = (upper - lower) / 100.0;

    for (var i = lower; i <= upper; i += increment) {
      var q = i;
      var p = gaussian(q, mean, sigma)
      var el = {
        "q": q,
        "p": p
      }
      data.push(el)
    };

    data.sort(function(x, y) {
      return x.q - y.q;
    });
    node.data = data;
  }
  function newGraph() {
    return {
      nodes: [],
      edges: [],
      nodeById: function(id) {
        if(!this._mapId) {
          this._mapId = {};
          for (var i=0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            this._mapId[node.id] = node;
          }
        }
        return this._mapId[id];
      },
      nodeByName: function(name) {
        if (!this._mapName) {
          this._mapName = {};
          for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            this._mapName[node.name] = node;
          }
        }
        return this._mapName[name];
      },
      nodeByUid: function(uid) {
        if (!this._mapUid) {
          this._mapUid = {};
          for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            this._mapUid[node.uid] = node;
          }
        }
        return this._mapUid[uid];
      },
      edge: function(name1, name2) {
        var n1 = this.nodeByUid(name1),
            n2 = this.nodeByUid(name2);
        var path = getPath(n1, n2);
        return path;
      },
      addEdge: function(parent, child) {
        var edge = {
          parent: parent,
          child: child
        };
        this.edges.push(edge);
        return edge;
      },
      addNode: function(mean, sigma, x, y, id, name) {
        var node = {
          data: [],
          x: x,
          y: y,
          id: id,
          name: name,
          uid: 'n' + id,
          width: gwidth,
          height: gheight,
          mean: mean,
          sigma: sigma
        };
        initNodeData(node);
        this.nodes.push(node);
        return node;
      }
    };
  }
  function getDagreGraph(graph) {
    var g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function() { return {}; });

    for(var i=0; i < graph.nodes.length; i++) {
      var n = graph.nodes[i];
      g.setNode(n.id, {
        label: n.label,
        width: n.width,
        height: n.height
      });
    }

    for(var i=0; i < graph.edges.length; i++) {
      var e = graph.edges[i];
      g.setEdge(e.parent, e.child);
    }
    return g;
  }
  function layoutGraph(graph) {
    var g = getDagreGraph(graph);
    dagre.layout(g);

    for(var i=0; i < graph.nodes.length; i++) {
      var gout = graph.nodes[i];
      var id = gout.id;
      var gin = g.node(id);
      if(gin) {
        gout.x = gin.x;
        gout.y = gin.y;
      }
    }

    for(var i=0; i < graph.edges.length; i++) {
      var eout = graph.edges[i];
      var e = { v: eout.parent, w: eout.child };
      var ein = g.edge(e);
      if(ein) {
        eout.points = ein.points;
      }
    }
  }
  function initSvg(options) {
    d3.select(options.id)
      .attr({
        width: options.width,
        height: options.height
      })
      .append('defs')
        .append('marker')
        .attr({
          id: 'arrow',
          markerWidth: 10,
          markerHeight: 10,
          refX: 5,
          refY: 3,
          orient: 'auto',
          markerUnits: 'strokeWidth'
        })
          .append('path')
          .attr({
            d: 'M0,0 L0,6 L5,3 z',
            fill: '#f00',
            class: 'edge-head'
          });
  }
  function formatNodeName(name) {
    var MAX = 15;
    if(name.length < MAX) {
      return name;
    }
    return name.substr(0, MAX);
  }
  function xAxisId(node) {
    return 'xAxis-' + node.uid;
  }
  function yAxisId(node) {
    return 'yAxis-' + node.uid;
  }
  function curveId(node) {
    return 'curve-' + node.uid;
  }
  function rescale(node) {
    var xId = '#' + xAxisId(node),
        yId = '#' + yAxisId(node),
        cId = '#' + curveId(node);
    
    var xmin = d3.min(node.data, function(d) { return d.q; });
    var xmax = d3.max(node.data, function(d) { return d.q; });
    var ymin = d3.min(node.data, function(d) { return d.p; });
    var ymax = d3.max(node.data, function(d) { return d.p; });

    var x = d3.scale.linear().domain([xmin, xmax]).range([0, gwidth]);
    var y = d3.scale.linear().domain([ymin, ymax]).range([gheight, 0]);

    var xAxis = d3.svg.axis().scale(x).ticks(4).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).ticks(4).orient("left");

    var line = d3.svg.line()
      .x(function(d) { return x(d.q); })
      .y(function(d) { return y(d.p); });
    
    d3.select(xId).transition().duration(1000).ease('circle').call(xAxis);
    d3.select(yId).transition().duration(1000).ease('bounce').call(yAxis);
    d3.select(cId).datum(node.data).attr({ d: line });
  }
  function drawNodesRect(nodes) {
    nodes.each(function(d) {
      d3.select(this)
        .append('rect')
        .attr({
          x: 0,
          y: 0,
          width: gwidth,
          height: gheight,
          fill: '#eceff1',
          class: 'node-rect',
          'data-node': d.uid,
        })
        .on('mousedown', function(d) {
          d3.selectAll('g.node-group').sort(function(a, b) {
            if (a.id !== d.id) {
              return -1;
            } else {
              return 1;
            }
          });
        });
    });
  }
  function drawNodesName(graph, SAMPLES, nodes) {
    nodes.each(function(d) {
      d3.select(this)
        .append('text')
        .attr({
          x: gwidth / 2,
          y: -5,
          fill: 'black',
          class: 'node-name',
          'font-family': 'monospace',
          'font-size': 12,
          'data-node': d.uid
        })
        .text(function(d) {
          return formatNodeName(d.name);
        })
        .style('text-anchor', 'middle')
        .on('click', function(n) { 
          var g = graph.graph;
          var node = g.node(n.id);
          node.unobserve();
          g.sample(SAMPLES);
        
          for(var i=0; i < g.nodes.length; i++) {
            var nOut = g.nodes[i];
            var nIn = graph.nodeById(nOut.id);
            nIn.mean = nOut.avg;
            initNodeData(nIn);
            rescale(nIn);
          }
        });
    });
  }
  function enableNodesDrag(graph, nodes) {
    var drag = d3.behavior.drag()
      .origin(function(d) {
        return d;
      })
      .on('dragstart', function(e) {
        d3.event.sourceEvent.stopPropagation();
      })
      .on('drag', function(e) {
        e.x = d3.event.x;
        e.y = d3.event.y;

        var id = 'g#' + e.uid;
        var translate = 'translate(' + e.x + ',' + e.y + ')';
        d3.select(id).attr({
          transform: translate
        });

        var arcs = 'line[data-parent=' + e.uid + ']';
        d3.selectAll(arcs)
          .each(function(d) {
            var points = graph.edge(d.parent, d.child);
            d3.select(this).attr({
              x1: points.x1,
              y1: points.y1,
              x2: points.x2,
              y2: points.y2
            });
          });

        arcs = 'line[data-child=' + e.uid + ']';
        d3.selectAll(arcs)
          .each(function(d) {
            var points = graph.edge(d.parent, d.child);
            d3.select(this).attr({
              x1: points.x1,
              y1: points.y1,
              x2: points.x2,
              y2: points.y2
            });
          });
      });

    nodes.call(drag);
  }
  function drawNodesCurve(nodes) {
    nodes.each(function(d) {
      d3.select(this)
        .append('path')
        .attr({
          id: curveId(d),
          'data-node': d.uid,
          class: 'node-line'
        });
    });
  }
  function drawNodesXAxis(graph, SAMPLES, nodes) {
    nodes.each(function(d) {
      d3.select(this)
        .append("g")
        .attr({
          id: xAxisId(d),
          class: 'node-x-axis axis',
          'data-node': d.uid,
          transform: 'translate(0,' + gheight + ')'
        })
        .on('click', function(n) {
          var min = n.x;
          var max = n.x + n.width;
          var range = max - min;
          var pct = (d3.event.x - min) / range;
          var xmin = n.data[0].q;
          var xmax = n.data[n.data.length-1].q;
          var xrange = xmax - xmin;
          var result = pct * xrange + xmin;
//          console.log(n.uid + ' result = ' + result);
          
          n.observed = true;
          var g = graph.graph;
          var node = g.node(n.id);
          node.observe(result);
          g.sample(SAMPLES);
          
          for(var i=0; i < g.nodes.length; i++) {
            var nOut = g.nodes[i];
            var nIn = graph.nodeById(nOut.id);
            nIn.mean = nOut.avg;
            initNodeData(nIn);
            rescale(nIn);
//            console.log(nIn.data);
          }
//          console.log(graph);
        });
    });
  }
  function drawNodesYAxis(nodes) {
    nodes.each(function(d) {
      d3.select(this)
        .append("g")
        .attr({
          id: yAxisId(d),
          class: 'node-y-axis axis',
          'data-node': d.uid
        });
    })
  }
  function drawNodes(options) {
    var SAMPLES = options.samples || 10000;
    var graph = options.graph;
    var nodes = d3.select(options.id)
      .selectAll('g')
      .data(graph.nodes)
      .enter()
      .append('g')
      .attr({
        id: function(d) {
          return d.uid;
        },
        class: 'node-group',
        transform: function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        }
      });
    
    drawNodesRect(nodes);
    drawNodesName(graph, SAMPLES, nodes);
    drawNodesCurve(nodes);
    drawNodesXAxis(graph, SAMPLES, nodes);
    drawNodesYAxis(nodes);
    
    nodes.each(function(d) {
      rescale(d);
    });
    
    enableNodesDrag(graph, nodes);
  }
  function drawEdges(options) {
    var graph = options.graph;
    var edges = d3.select(options.id)
      .selectAll('line')
      .data(graph.edges)
      .enter()
      .append('line')
      .each(function(d) {
        var points = graph.edge(d.parent, d.child);
        d3.select(this).attr({
          'data-parent': d.parent,
          'data-child': d.child,
          x1: points.x1,
          y1: points.y1,
          x2: points.x2,
          y2: points.y2,
          style: 'stroke:rgb(255,0,0);stroke-width:2',
          class: 'edge-line',
          'marker-end': 'url(#arrow)'
        });
      });
  }
  function drawGraph(options) {
    initSvg(options);
    layoutGraph(options.graph);
    drawEdges(options);
    drawNodes(options);
  }
  function defineLib() {
    var lib = {};
    lib.fromGraph = function(graph) {
      var g = newGraph();
      for(var i=0; i < graph.nodes.length; i++) {
        var n = graph.nodes[i];
        g.addNode(n.avg, n.stdev, 0, 0, n.id, n.name);
      }
      
      for(var i=0; i < graph.nodes.length; i++) {
        var n_i = graph.nodes[i];
        var child = g.nodeById(n_i.id);
        for(var j=0; j < n_i.parents.length; j++) {
          var n_j = graph.node(n_i.parents[j]);
          var parent = g.nodeById(n_j.id);
          g.addEdge(parent.uid, child.uid);
        }
      }

      g.graph = graph;
      return g;
    }
    lib.draw = function(options) {
      drawGraph(options);
    }
    return lib;
  }

  if (typeof module === 'object' && module && typeof module.exports === 'object') {
    dagre = require('dagre');
    d3 = require('d3');
    jsbayeslcg = require('jsbayes-lcg');
    module.exports = defineLib();
  } else {
    if (typeof(jsbayeslcgviz) === 'undefined') {
      dagre = window.dagre;
      d3 = window.d3;
      jsbayeslcg = window.jsbayeslcg;
      window.jsbayeslcgviz = defineLib();
    }

    if (typeof define === 'function' && define.amd) {
      define('jsbayeslcgviz', [], defineLib());
    }
  }

})(this);
