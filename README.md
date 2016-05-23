jsbayes-lcg-viz
===========

This JavaScript library is a linear gaussian (LG) Bayesian Belief Network (BBN) visualization and interaction tool. It is built on the following projects.

* [d3](https://github.com/mbostock/d3)
* [dagre](https://github.com/cpettitt/dagre)
* [jsbayes-lcg](https://github.com/vangj/jsbayes-lcg)

How do I use jsbayes-lcg-viz?
=========================

You should only be using this library on the client-side (e.g. with a browser). You may install this library using [bower](http://bower.io).

`bower install jsbayes-lcg-viz --save`

Since there are third party dependencies, you need to reference them in your HTML in the following order. Assuming you have used bower to install the library (and its dependencies), you may reference the libaries as the following.

```
<script src="bower_components/d3/d3.js"></script>
<script src="bower_components/lodash/lodash.js"></script>
<script src="bower_components/graphlib/dist/graphlib.core.js"></script>
<script src="bower_components/dagre/dist/dagre.core.js"></script>
<script src="bower_components/jquery/dist/jquery.js"></script>
<script src="bower_components/jsbayes-lcg/jsbayes-lcg.js"></script>
<script src="bower_components/jsbayes-lcg-viz/jsbayes-lcg-viz.js"></script>
```

jsbayes-lcg is the inference engine, so to use jsbayes-lcg-viz, first create a jsbayes-lcg graph.

```
var means = [ 
  [1], 
  [-4.5], 
  [8.5] 
];
var sigma = [ 
  [4,2,-1], 
  [2, 5, -5], 
  [-2, -5, 8]
];
var graph = jsbayeslcg.newGraph(means, sigma);
var n2 = graph.defineNode('n2', 2, [1]);
var n1 = graph.defineNode('n1', 1, [0]);
var n0 = graph.defineNode('n0', 0);

var T = 15000;
graph.sample(T);
```

Then you create a corresponding jsbayes-lcg-viz graph from the jsbayes graph.

```
var g = jsbayeslcgviz.fromGraph(graph);
```

Assuming on your HTML page, you have an SVG element like the following.

```
<svg id="bbn"></svg>
```

Then you can kick off the visualization as follows.

```
jsbayeslcgviz.draw({
  id: '#bbn',
  width: 800,
  height: 800,
  graph: g,
  samples: 15000
});
```

You may also download the samples in JSON or CSV format. To download in JSON format, call the following method. Note the first parameter is the graph (jsbayes-lcg-viz graph, *NOT* the jsbayes graph), the second parameter specifies the format (true means JSON and false means CSV), and the last parameter are options. Options are only available for CSV format, namely, to specify row and field delimiters.


```
jsbayeslcgviz.downloadSamples(graph, true);
```

An example of downloading samples as CSV is shown below.

```
jsbayeslcgviz.downloadSamples(graph, false, { rowDelimiter: '\n', fieldDelimiter: ',' });
```

Styling
=======
Each of the SVG components are now associated with a CSS class. You may apply a stylesheet to customize the look and feel of each of these SVG components/elements.

* .node-group : all the elements belonging to a node
* .node-rect : background of graph area where the gaussian curve is drawn
* .node-name : the name of a node
* .node-line : the guassian curve
* .node-x-axis: the x-axis of the guassian curve
* .node-y.axis: the y-axis of the gaussian curve
* .edge-line : the arc between two nodes
* .edge-head : the arrow head at the end of an arc

Here's an example.

```
svg g.node-group { cursor: move; }
svg g rect.node-rect { fill: #eceff1 }
svg g text.node-name { cursor: crosshair; }
svg g path.node-line { fill: none; stroke: steelblue; stroke-width: 1.5px; }
svg g g.node-x-axis { cursor: crosshair; font: 10px sans-serif; -webkit-user-select: none; -moz-user-select: none; user-select: none; }
svg g g.node-y-axis { font: 10px sans-serif; -webkit-user-select: none; -moz-user-select: none; user-select: none; }
```
Note that some styles for the elements are inlined and so you must use `!important` to override them.

Some gotcha's
=============
If you have very long string literals as values for the node names, they will be truncated to 15 characters. Click on the x-axis to change the value of a node. Click on the node name to reset the value of a node.

Lastly
======
A working example is shown [here on Plunker](https://run.plnkr.co/plunks/dTCNBPostFYTPhc4XfAQ/) and you may fork the demo code by clicking [here](https://plnkr.co/edit/dTCNBPostFYTPhc4XfAQ).

NOTICE
======
THIS IS BETA SOFTWARE; USE AT YOUR OWN RISK.