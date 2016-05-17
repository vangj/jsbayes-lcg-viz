(function(window) {
	'use strict';
	function defineLib() {
		var lib = {};
		return lib;
	}

	if(typeof module === 'object' && module && typeof module.exports === 'object') {
    dagre = require('dagre');
    d3 = require('d3');
    jsbayeslcg = require('jsbayes-lcg');
    module.exports = defineLib();
  } else {
    if(typeof(jsbayeslcgviz) === 'undefined') {
      dagre = window.dagre;
      d3 = window.d3;
      jsbayeslcg = window.jsbayeslcg;
      window.jsbayeslcgviz = defineLib();
    }

    if(typeof define === 'function' && define.amd) {
      define('jsbayeslcgviz', [], defineLib());
    }

})(this);