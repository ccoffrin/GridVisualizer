(function(f) { 
	if(typeof exports==="object"&&typeof module!=="undefined"){
		module.exports = f()
	}
	else if(typeof define==="function"&&define.amd) {
		define([],f)
	}
	else { 
		var g;
		if(typeof window!=="undefined") { 
			g = window;
		}
		else if(typeof global!=="undefined") { 
			g = global
		}
		else if(typeof self!=="undefined") { 
			g=self
		} 
		else { 
			g = this
		}
		g.ngraph = f()
	}
})

(function() {
	var define,module,exports;
	return (function e(t,n,r) {
		function s(o,u) { 
			if(!n[o]) { 
				if(!t[o]) { 
					var a = typeof require=="function"&&require;
					if(!u&&a) {
						return a(o,!0);
					}
					if(i) {
						return i(o,!0);
					}
					var f = new Error("Cannot find module '"+o+"'");
					throw f.code="MODULE_NOT_FOUND",f
				}
				var l = n[o] = {exports:{}};
				t[o][0].call(l.exports,function(e){
					var n=t[o][1][e];
					return s(n?n:e)},l,l.exports,e,t,n,r)
				}
				return n[o].exports
		}
	var i = typeof require=="function"&&require;
	for(var o=0;o<r.length;o++)
		s(r[o]);
	return s
})

({1:[function(require,module,exports) {
	module.exports.main = function () {
		$('canvas').remove();
		var graph = require('ngraph.gens').powerNetworkGraph();
		var createPixiGraphics = require('ngraph.pixi');
		var pixiGraphics = createPixiGraphics(graph);

		var stage = pixiGraphics.stage;
		stage.hitArea = new PIXI.Rectangle(0, 0, (window.innerWidth - 199), window.innerHeight);
	  
		stage.interaction = true;
		//stage.interactive = true;  
		stage.draggable = true;
	  
		var isDragging = true,
			nodeUnderCursor,
			prevX, prevY;
			
	  // setup our custom looking nodes and links:
	  pixiGraphics.createNodeUI(require('./lib/createNodeUI'))
	  .renderNode(require('./lib/renderNode'))
		.createLinkUI(require('./lib/createLinkUI'))
		.renderLink(require('./lib/renderLink'));

	  // just make sure first node does not move:
	  var layout = pixiGraphics.layout;
	  //layout.pinNode(graph.getNode(1), true);

	  // begin animation loop:
	  pixiGraphics.run();
	}
},{"./lib/createLinkUI":2,"./lib/createNodeUI":3,"./lib/renderLink":4,"./lib/renderNode":5,"ngraph.gens":8,"ngraph.pixi":19}],
2:[function(require,module,exports) {
	module.exports = function (link) {
	  var data = link.data.edgeData;
	  var width = Math.log(link.data.edgeWeight);
	  //Commented and a default value of the width added to the graph for investigation purpose...the change for the width should be reverted once the investigation code is complete.
		if(width > 10) {
			width = 10;
		}
		else if(width < 1) {
			width = 1;
		}
		width = 8;
	  return {
		//Calculated width using Math.log([1/(R*R + X*X)]) and then - down scaled by a factor of 1000...becasue by just using the formula [1/(R*R + X*X)] for the width the lines in the graph were coming exceptionally thick.+
		width : width,
		data : link.data
	  }
	}; 
},{}],
3:[function(require,module,exports){
	module.exports = function (node) {
	  return (new AnimatedNode(node));
	}

	function AnimatedNode(node) {
		this.frame = 8;
		this.v = 8;
		this.id = node.id;
		this.x = null;
		this.y = null;
		this.data = node.data;
	}

	AnimatedNode.prototype.renderFrame = function() {
		this.color = 0x00FFFF;
		this.frame = 8;
		this.width = 8;
	}
},{}],
4:[function(require,module,exports){
		module.exports = function (link, ctx) {
	  
		//Adding special color for the transformer lines.
		/*if(link.data.edgeType === "Transformer") {
			ctx.lineStyle(link.width, 0xff9900, 1);
		}
		else {
		  ctx.lineStyle(link.width, 0x333333, 1);
		}
		if(link.data.Bucket !== undefined) {
			if(link.data.Bucket.length > 0 && link.data.expanded === false)
				ctx.lineStyle(link.width, 0xFF0000, 1);
		}*/
		
		ctx.lineStyle(link.width, 0xFF0000, 1);
		ctx.moveTo(link.from.x, link.from.y);
		ctx.lineTo(link.to.x, link.to.y);
	}
},{}],
5:[function(require,module,exports){
		module.exports = function (animatedNode, ctx) {
		
		animatedNode.renderFrame();
//		animatedNode.color = NETWORK.baseKVColorMapping[parseInt(animatedNode.data.baseKV)];
		//animatedNode.color = NETWORK.baseKVColorMapping[parseInt(0x054324)];
		ctx.lineStyle(0);
		ctx.beginFill(animatedNode.color,1);
		ctx.drawCircle(animatedNode.pos.x, animatedNode.pos.y, animatedNode.width);
	}
},{}],
6:[function(require,module,exports){
	module.exports = function(subject) {
		validateSubject(subject);

	  var eventsStorage = createEventsStorage(subject);
	  subject.on = eventsStorage.on;
	  subject.off = eventsStorage.off;
	  subject.fire = eventsStorage.fire;
	  return subject;
	};

	function createEventsStorage(subject) {
	  // Store all event listeners to this hash. Key is event name, value is array
	  // of callback records.
	  //
	  // A callback record consists of callback function and its optional context:
	  // { 'eventName' => [{callback: function, ctx: object}] }
	  var registeredEvents = {};

	  return {
		on: function (eventName, callback, ctx) {
		  if (typeof callback !== 'function') {
			throw new Error('callback is expected to be a function');
		  }
		  if (!registeredEvents.hasOwnProperty(eventName)) {
			registeredEvents[eventName] = [];
		  }
		  registeredEvents[eventName].push({callback: callback, ctx: ctx});

		  return subject;
		},

		off: function (eventName, callback) {
		  var wantToRemoveAll = (typeof eventName === 'undefined');
		  if (wantToRemoveAll) {
			// Killing old events storage should be enough in this case:
			registeredEvents = {};
			return subject;
		  }

		  if (registeredEvents.hasOwnProperty(eventName)) {
			var deleteAllCallbacksForEvent = (typeof callback !== 'function');
			if (deleteAllCallbacksForEvent) {
			  delete registeredEvents[eventName];
			} else {
			  var callbacks = registeredEvents[eventName];
			  for (var i = 0; i < callbacks.length; ++i) {
				if (callbacks[i].callback === callback) {
				  callbacks.splice(i, 1);
				}
			  }
			}
		  }

		  return subject;
		},

		fire: function (eventName) {
		  var noEventsToFire = !registeredEvents.hasOwnProperty(eventName);
		  if (noEventsToFire) {
			return subject; 
		  }

		  var callbacks = registeredEvents[eventName];
		  var fireArguments = Array.prototype.splice.call(arguments, 1);
		  for(var i = 0; i < callbacks.length; ++i) {
			var callbackInfo = callbacks[i];
			callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
		  }

		  return subject;
		}
	  };
	}

	function validateSubject(subject) {
	  if (!subject) {
		throw new Error('Eventify cannot use falsy object as events subject');
	  }
	  var reservedWords = ['on', 'fire', 'off'];
	  for (var i = 0; i < reservedWords.length; ++i) {
		if (subject.hasOwnProperty(reservedWords[i])) {
		  throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
		}
	  }
	}

},{}],
7:[function(require,module,exports){
	module.exports = createLayout;

	// Maximum movement of the system at which system should be considered as stable
	var MAX_MOVEMENT = 0.001; 

	/**
	 * Creates force based layout for a given graph.
	 * @param {ngraph.graph} graph which needs to be layed out
	 */
	function createLayout(graph, physicsSimulator) {
	  if (!graph) {
		throw new Error('Graph structure cannot be undefined');
	   }

	  var random = require('ngraph.random').random(1),
		  simulator = require('ngraph.physics.simulator'),
		  physics = require('ngraph.physics.primitives');

	  physicsSimulator = physicsSimulator || simulator();

	  var nodeBodies = {},
		  springs = {},
		  graphRect = { x1: 0, y1: 0, x2: 0, y2: 0 };

	  // Initialize physical objects according to what we have in the graph:
	  initPhysics();
	  listenToGraphEvents();

	 //These will help determine when the total Movement is to be checked. 
	 //This is to stop the graph from wobbling once it has reached a stable layout.
	 var timer = 0, hitcount = 0;
	
	return {
		 //Performs one step of iterative layout algorithm     
		step: function() {
			if(boolAutoLayout) {
				var totalMovement = physicsSimulator.step();
				updateGraphRect();
				return totalMovement < MAX_MOVEMENT;
			}
			else {
				//Do nothing as the auto layout has been switched off.
			}
		},

		//For a given 'nodeId' returns position
		getNodePosition: function (nodeId) {
		  return getInitializedBody(nodeId).pos;
		},

		//Sets position of a node to a given coordinates
		setNodePosition: function (nodeId, x, y) {
		  var body = getInitializedBody(nodeId);
		  if (body) {
			body.prevPos.x = body.pos.x = x;
			body.prevPos.y = body.pos.y = y;
		  }
		},
		/**
		 * @returns {Object} Link position by link id
		 * @returns {Object.from} {x, y} coordinates of link start
		 * @returns {Object.to} {x, y} coordinates of link end
		 */
		getLinkPosition: function (linkId) {
		  var spring = springs[linkId];
		  if (spring) {
			return {
			  from: spring.from.pos,
			  to: spring.to.pos
			};
		  }
		},

		/**
		 * @returns {Object} area required to fit in the graph. Object contains
		 * `x1`, `y1` - top left coordinates
		 * `x2`, `y2` - bottom right coordinates
		 */
		getGraphRect: function () {
		  return graphRect;
		},

		/*
		 * Requests layout algorithm to pin/unpin node to its current position
		 * Pinned nodes should not be affected by layout algorithm and always
		 * remai at their position
		 */
		pinNode: function (node, isPinned) {
		  var body = getInitializedBody(node.id);
		   body.isPinned = !!isPinned;
		},

		/**
		 * Checks whether given graph's node is currently pinned
		 */
		isNodePinned: function (node) {
		  return getInitializedBody(node.id).isPinned;
		},

		/**
		 * Request to release all resources
		 */
		dispose: function() {
		  graph.off('changed', onGraphChanged);
		}
	};

	function listenToGraphEvents() {
		graph.on('changed', onGraphChanged);
	}

  function onGraphChanged(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i];
      if (change.changeType === 'add') {
        if (change.node) {
          initBody(change.node.id);
        }
        if (change.link) {
          initLink(change.link);
        }
      } else if (change.changeType === 'remove') {
        if (change.node) {
          releaseNode(change.node);
        }
        if (change.link) {
          releaseLink(change.link);
        }
      }
    }
  }

  function initPhysics() {
    graph.forEachNode(function (node) {
      initBody(node.id);
    });
    graph.forEachLink(initLink);
  }

  function initBody(nodeId) {
    var body = nodeBodies[nodeId];
    if (!body) {
      var node = graph.getNode(nodeId);
      if (!node) {
        throw new Error('initBody() was called with unknown node id');
      }

      var pos = getBestInitialNodePosition(node);
      body = new physics.Body(pos.x, pos.y);
      // we need to augment body with previous position to let users pin them
      body.prevPos = new physics.Vector2d(pos.x, pos.y);

      nodeBodies[nodeId] = body;
      updateBodyMass(nodeId);

      if (isNodeOriginallyPinned(node)) {
        body.isPinned = true;
      }

      physicsSimulator.addBody(body);
    }
  }

  function releaseNode(node) {
    var nodeId = node.id;
    var body = nodeBodies[nodeId];
    if (body) {
      nodeBodies[nodeId] = null;
      delete nodeBodies[nodeId];

      physicsSimulator.removeBody(body);
      if (graph.getNodesCount() === 0) {
        graphRect.x1 = graphRect.y1 = 0;
        graphRect.x2 = graphRect.y2 = 0;
      }
    }
  }

	function initLink(link) {
		updateBodyMass(link.fromId);
		updateBodyMass(link.toId);

		var fromBody = nodeBodies[link.fromId],
			toBody  = nodeBodies[link.toId],
			data = link.data.edgeData,
			springCoefficient = Math.log(link.data.edgeWeight);
		
		if(springCoefficient > 0.0001) {
			springCoefficient = 0.0001;
		}
		
		var spring = physicsSimulator.addSpring(fromBody, toBody, link.length,undefined,springCoefficient);		
		springs[link.id] = spring;
	}

  function releaseLink(link) {
    var spring = springs[link.id];
    if (spring) {
      var from = graph.getNode(link.fromId),
          to = graph.getNode(link.toId);

      if (from) updateBodyMass(from.id);
      if (to) updateBodyMass(to.id);

      delete springs[link.id];

      physicsSimulator.removeSpring(spring);
    }
  }

  function getBestInitialNodePosition(node) {
    // TODO: Initial position could be picked better, e.g. take into
    // account all neighbouring nodes/links, not only one.
    // How about center of mass?
    if (node.position) {
      return node.position;
    }

    var baseX = (graphRect.x1 + graphRect.x2) / 2,
        baseY = (graphRect.y1 + graphRect.y2) / 2,
        springLength = physicsSimulator.springLength();

    if (node.links && node.links.length > 0) {
      var firstLink = node.links[0],
          otherBody = firstLink.fromId !== node.id ? nodeBodies[firstLink.fromId] : nodeBodies[firstLink.toId];
      if (otherBody && otherBody.pos) {
        baseX = otherBody.pos.x;
        baseY = otherBody.pos.y;
      }
    }

    return {
      x: baseX + random.next(springLength) - springLength / 2,
      y: baseY + random.next(springLength) - springLength / 2
    };
  }

  function updateBodyMass(nodeId) {
    var body = nodeBodies[nodeId];
    body.mass = nodeMass(nodeId);
  }


  function updateGraphRect() {
    if (graph.getNodesCount() === 0) {
      // don't have to wory here.
      return;
    }

    var x1 = Number.MAX_VALUE,
        y1 = Number.MAX_VALUE,
        x2 = Number.MIN_VALUE,
        y2 = Number.MIN_VALUE;

    // this is O(n), could it be done faster with quadtree?
    for (var key in nodeBodies) {
      if (nodeBodies.hasOwnProperty(key)) {
        // how about pinned nodes?
        var body = nodeBodies[key];
        if (isBodyPinned(body)) {
          body.pos.x = body.prevPos.x;
          body.pos.y = body.prevPos.y;
        } else {
          body.prevPos.x = body.pos.x;
          body.prevPos.y = body.pos.y;
        }
        if (body.pos.x < x1) {
          x1 = body.pos.x;
        }
        if (body.pos.x > x2) {
          x2 = body.pos.x;
        }
        if (body.pos.y < y1) {
          y1 = body.pos.y;
        }
        if (body.pos.y > y2) {
          y2 = body.pos.y;
        }
      }
    }

    graphRect.x1 = x1;
    graphRect.x2 = x2;
    graphRect.y1 = y1;
    graphRect.y2 = y2;
  }

  /**
   * Checks whether graph node has in its settings pinned attribute,
   * which means layout algorithm cannot move it. Node can be preconfigured
   * as pinned, if it has "isPinned" attribute, or when node.data has it.
   *
   * @param {Object} node a graph node to check
   * @return {Boolean} true if node should be treated as pinned; false otherwise.
   */
  function isNodeOriginallyPinned(node) {
    return (node && (node.isPinned || (node.data && node.data.isPinned)));
  }

  /**
   * Checks whether given physical body should be treated as pinned. Unlinke
   * `isNodeOriginallyPinned` this operates on body object, which is specific to layout
   * instance. Thus two layouters can independntly pin bodies, which represent
   * same node of a source graph.
   *
   * @param {ngraph.physics.Body} body - body to check
   * @return {Boolean} true if body should be treated as pinned; false otherwise.
   */
  function isBodyPinned (body) {
    return body.isPinned;
  }

  function getInitializedBody(nodeId) {
    var body = nodeBodies[nodeId];
    if (!body) {
      initBody(nodeId);
      body = nodeBodies[nodeId];
    }
    return body;
  }

  /**
   * Calculates mass of a body, which corresponds to node with given id.
   *
   * @param {String|Number} nodeId identifier of a node, for which body mass needs to be calculated
   * @returns {Number} recommended mass of the body;
   */
  function nodeMass(nodeId) {
	  return (1 + graph.getLinks(nodeId).length / 3.0);
  }
}

},{"ngraph.physics.primitives":11,"ngraph.physics.simulator":12,"ngraph.random":26}],
8:[function(require,module,exports){
	module.exports = {
		powerNetworkGraph: powerNetworkGraph
	};
	var createGraph = require('ngraph.graph');

	/**
	*	Creates the Graph for the power network input file.
	*	The custom computations should also be done at this point.
	**/
	function powerNetworkGraph() {
		//Need to be made a global object.
		nodes = COMPRESSED_NET[0].nodes;
		list = COMPRESSED_NET[0].branchDO;
		g = createGraph();
		var availableBusID = [];
		/*Region Begins - Investigation code for adding the dynamic link funcationality for the graph */
		for (var i = 0; i < list.length; i++) {
			var fromId = list[i].source,
				toId = list[i].target;
			g.addLink(fromId, toId, list[i], nodes);
			if(availableBusID.indexOf(fromId) === -1) {
				availableBusID.push(fromId);
			}
			if(availableBusID.indexOf(toId) === -1) {
				availableBusID.push(toId);
			}
				
		}
		/*Region Ends*/
		
		
		//Adding the search tag ids to the div
		var searchBox1 = new NETWORK.SearchBox(availableBusID,"#tags");
		searchBox1.autoComplete();
		
		//shortTestPathMatrixCola();
		return g;
	}
},{"ngraph.graph":9}],
9:[function(require,module,exports){
/**
 * @fileOverview Contains definition of the core graph object.
 */

/**
 * @example
 *  var graph = require('ngraph.graph')();
 *  graph.addNode(1);     // graph has one node.
 *  graph.addLink(2, 3);  // now graph contains three nodes and one link.
 *
 */
module.exports = function () {
    // Graph structure is maintained as dictionary of nodes
    // and array of links. Each node has 'links' property which
    // hold all links related to that node. And general links
    // array is used to speed up all links enumeration. This is inefficient
    // in terms of memory, but simplifies coding.

    var nodes = {},
        links = [],
        // Hash of multi-edges. Used to track ids of edges between same nodes
        multiEdges = {},
        nodesCount = 0,
        suspendEvents = 0,

        // Accumlates all changes made during graph updates.
        // Each change element contains:
        //  changeType - one of the strings: 'add', 'remove' or 'update';
        //  node - if change is related to node this property is set to changed graph's node;
        //  link - if change is related to link this property is set to changed graph's link;
        changes = [],

        fireGraphChanged = function (graph) {
            graph.fire('changed', changes);
        },

        // Enter, Exit Mofidication allows bulk graph updates without firing events.
        enterModification = function () {
            suspendEvents += 1;
        },

        exitModification = function (graph) {
            suspendEvents -= 1;
            if (suspendEvents === 0 && changes.length > 0) {
                fireGraphChanged(graph);
                changes.length = 0;
            }
        },

        recordNodeChange = function (node, changeType) {
            changes.push({node : node, changeType : changeType});
        },

        recordLinkChange = function (link, changeType) {
            changes.push({link : link, changeType : changeType});
        },
        linkConnectionSymbol = '-';

    var graphPart = {

        /**
         * Adds node to the graph. If node with given id already exists in the graph
         * its data is extended with whatever comes in 'data' argument.
         *
         * @param nodeId the node's identifier. A string or number is preferred.
         *   note: Node id should not contain 'linkConnectionSymbol'. This will break link identifiers
         * @param [data] additional data for the node being added. If node already
         *   exists its data object is augmented with the new one.
         *
         * @return {node} The newly added node or node with given id if it already exists.
         */
        addNode : function (nodeId, data) {
            if (typeof nodeId === 'undefined') {
                throw new Error('Invalid node identifier');
            }

            enterModification();

            var node = this.getNode(nodeId);
            if (!node) {
                // TODO: Should I check for linkConnectionSymbol here?
                node = new Node(nodeId);
                nodesCount++;

                recordNodeChange(node, 'add');
            } else {
                recordNodeChange(node, 'update');
            }

            node.data = data;

            nodes[nodeId] = node;

            exitModification(this);
            return node;
        },
		
        /**
         * Adds a link to the graph. The function always create a new
         * link between two nodes. If one of the nodes does not exists
         * a new node is created.
         *
         * @param fromId	Link start node id.
         * @param toId		Link end node id.
         * @param data		Additional data to be set on the new link.
         * @param nodes		The list of nodes in the graph.
		 * @param map		The Map of the bus_i and their index in the arrays.
         * @return {link} The newly created link
         */
        addLink : function (fromId, toId, data, nodes, map) {
            enterModification();
			var fromNode, toNode, linkId, isMultiEdge, link, fromNodeDashData, toNodeDashData;
			
			fromNode = this.getNode(fromId) || this.addNode(fromId, nodes[fromId]);
            toNode = this.getNode(toId) || this.addNode(toId, nodes[toId]);
			
			//fromNode = this.addNode(fromId);
            //toNode = this.addNode(toId);
			
			if(fromNode !== undefined && toNode !== undefined) {			
				linkId = fromId.toString() + linkConnectionSymbol + toId.toString();
				isMultiEdge = multiEdges.hasOwnProperty(linkId);
				if (isMultiEdge || this.hasLink(fromId, toId)) {
					if (!isMultiEdge) {
						multiEdges[linkId] = 0;
					}
					linkId += '@' + (++multiEdges[linkId]);
				}

				link = new Link(fromId, toId, data, linkId);

				links.push(link);

				//It causes high memory consumption for Large graphs.
				fromNode.links.push(link);
				toNode.links.push(link);

				recordLinkChange(link, 'add');

				exitModification(this);

				return link;
			}
			else {
				return undefined;
			}
        },

        /**
         * Removes link from the graph. If link does not exist does nothing.
         *
         * @param link - object returned by addLink() or getLinks() methods.
         *
         * @returns true if link was removed; false otherwise.
         */
        removeLink : function (link) {
            if (!link) { return false; }
			
            var idx = links.indexOf(link);
            if (idx < 0) { return false; }

            enterModification();

            links.splice(idx, 1);

            var fromNode = this.getNode(link.fromId);
            var toNode = this.getNode(link.toId);

            if (fromNode) {
                idx = fromNode.links.indexOf(link);
                if (idx >= 0) {
                    fromNode.links.splice(idx, 1);
                }
            }

            if (toNode) {
                idx = toNode.links.indexOf(link);
                if (idx >= 0) {
                    toNode.links.splice(idx, 1);
                }
            }

            recordLinkChange(link, 'remove');

            exitModification(this);

            return true;
        },

        /**
         * Removes node with given id from the graph. If node does not exist in the graph
         * does nothing.
         *
         * @param nodeId node's identifier passed to addNode() function.
         *
         * @returns true if node was removed; false otherwise.
         */
        removeNode: function (nodeId) {
            var node = this.getNode(nodeId);
            if (!node) { return false; }

            enterModification();

            while (node.links.length) {
                var link = node.links[0];
                this.removeLink(link);
            }

            delete nodes[nodeId];
            nodesCount--;

            recordNodeChange(node, 'remove');

            exitModification(this);

            return true;
        },

        /**
         * Gets node with given identifier. If node does not exist undefined value is returned.
         * @param nodeId requested node identifier;
         * @return {node} in with requested identifier or undefined if no such node exists.
         */
        getNode : function (nodeId) {
            return nodes[nodeId];
        },

        /**
         * Gets number of nodes in this graph.
         * @return number of nodes in the graph.
         */
        getNodesCount : function () {
            return nodesCount;
        },

        /**
         * Gets all links (inbound and outbound) from the node with given id.
         * If node with given id is not found null is returned.
         * @param nodeId requested node identifier.
         * @return Array of links from and to requested node if such node exists;
         *   otherwise null is returned.
         */
        getLinks : function (nodeId) {
            var node = this.getNode(nodeId);
            return node ? node.links : null;
        },

        /**
         * Invokes callback on each node of the graph.
         * @param {Function(node)} callback Function to be invoked. The function
         *   is passed one argument: visited node.
         */
        forEachNode : function (callback) {
            if (typeof callback !== 'function') {
                return;
            }
            var node;

            for (node in nodes) {
                if (nodes.hasOwnProperty(node)) {
                    if (callback(nodes[node])) {
                        return; // client doesn't want to proceed. return.
                    }
                }
            }
        },

        /**
         * Invokes callback on every linked (adjacent) node to the given one.
         *
         * @param nodeId Identifier of the requested node.
         * @param {Function(node, link)} callback Function to be called on all linked nodes.
         *   The function is passed two parameters: adjacent node and link object itself.
         * @param oriented if true graph treated as oriented.
         */
        forEachLinkedNode : function (nodeId, callback, oriented) {
            var node = this.getNode(nodeId),
                i,
                link,
                linkedNodeId;

            if (node && node.links && typeof callback === 'function') {
                // Extraced orientation check out of the loop to increase performance
                if (oriented) {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        if (link.fromId === nodeId) {
                            callback(nodes[link.toId], link);
                        }
                    }
                } else {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        linkedNodeId = link.fromId === nodeId ? link.toId : link.fromId;

                        callback(nodes[linkedNodeId], link);
                    }
                }
            }
        },

        /**
         * Enumerates all links in the graph
         *
         * @param {Function(link)} callback Function to be called on all links in the graph.
         *   The function is passed one parameter: graph's link object.
         *
         * Link object contains at least the following fields:
         *  fromId - node id where link starts;
         *  toId - node id where link ends,
         *  data - additional data passed to graph.addLink() method.
         */
        forEachLink : function (callback) {
            var i, length;
            if (typeof callback === 'function') {
                for (i = 0, length = links.length; i < length; ++i) {
                    callback(links[i]);
                }
            }
        },

        /**
         * Suspend all notifications about graph changes until
         * endUpdate is called.
         */
        beginUpdate : function () {
            enterModification();
        },

        /**
         * Resumes all notifications about graph changes and fires
         * graph 'changed' event in case there are any pending changes.
         */
        endUpdate : function () {
            exitModification(this);
        },

        /**
         * Removes all nodes and links from the graph.
         */
        clear : function () {
            var that = this;
            that.beginUpdate();
            that.forEachNode(function (node) { that.removeNode(node.id); });
            that.endUpdate();
        },

        /**
         * Detects whether there is a link between two nodes.
         * Operation complexity is O(n) where n - number of links of a node.
         *
         * @returns link if there is one. null otherwise.
         */
        hasLink : function (fromNodeId, toNodeId) {
            // TODO: Use adjacency matrix to speed up this operation.
            var node = this.getNode(fromNodeId),
                i;
            if (!node) {
                return null;
            }

            for (i = 0; i < node.links.length; ++i) {
                var link = node.links[i];
                if (link.fromId === fromNodeId && link.toId === toNodeId) {
                    return link;
                }
            }

            return null; // no link.
        }
    };

    // Let graph fire events before we return it to the caller.
    var eventify = require('ngraph.events');
    eventify(graphPart);

    return graphPart;
};

	/**
	* Internal structure to represent node;
	*/
	function Node(id) {
		this.id = id;
		this.links = [];
		this.data = null;
	}


	/**
	* Internal structure to represent links;
	*/
	function Link(fromId, toId, data, id) {
		this.fromId = fromId;
		this.toId = toId;
		this.data = data;
		this.id = id;
	}

},{"ngraph.events":6}],
10:[function(require,module,exports){
	module.exports = merge;
	/**
	 * Augments `target` with properties in `options`. Does not override
	 * target's properties if they are defined and matches expected type in 
	 * options
	 *
	 * @returns {Object} merged object
	 */
	function merge(target, options) {
	  var key;
	  if (!target) { target = {}; }
	  if (options) {
		for (key in options) {
		  if (options.hasOwnProperty(key)) {
			var targetHasIt = target.hasOwnProperty(key),
				optionsValueType = typeof options[key],
				shouldReplace = !targetHasIt || (typeof target[key] !== optionsValueType);

			if (shouldReplace) {
			  target[key] = options[key];
			} else if (optionsValueType === 'object') {
			  // go deep, don't care about loops here, we are simple API!:
			  target[key] = merge(target[key], options[key]);
			}
		  }
		}
	  }

	  return target;
	}
},{}],
11:[function(require,module,exports){
	module.exports = {
		Body: Body,
		Vector2d: Vector2d	
	};

	function Body(x, y) {
	  this.pos = new Vector2d(x, y);
	  this.force = new Vector2d();
	  this.velocity = new Vector2d();
	  this.mass = 1;
	}

	function Vector2d(x, y) {
	  this.x = typeof x === 'number' ? x : 0;
	  this.y = typeof y === 'number' ? y : 0;
	}

},{}],
12:[function(require,module,exports){
	/**
	 * Manages a simulation of physical forces acting on bodies and springs.
	 */
	module.exports = physicsSimulator;

	function physicsSimulator(settings) {
	  var Spring = require('./lib/spring');
	  var createQuadTree = require('ngraph.quadtreebh');
	  var createDragForce = require('./lib/dragForce');
	  var createClickAction = require('./lib/clickAction');
	  
	  var createSpringForce = require('./lib/springForce');
	  var integrate = require('./lib/eulerIntegrator');
	  var expose = require('./lib/exposeProperties');
	  var merge = require('ngraph.merge');

	  //Manipulate these to make the updates after the meeting - 20/01/2016
	  settings = merge(settings, {	
		  /**
		   * Ideal length for links (springs in physical model).
		   */
		  springLength: 80,

		  /**
		   * Hook's law coefficient. 1 - solid spring.
		   */
		  springCoeff: 0.0002,

		  /**
		   * Coulomb's law coefficient. It's used to repel nodes thus should be negative
		   * if you make it positive nodes start attract each other :).
		   */
		  gravity: -1.2,	

		  /**
		   * Theta coeffiecient from Barnes Hut simulation. Ranged between (0, 1).
		   * The closer it's to 1 the more nodes algorithm will have to go through.
		   * Setting it to one makes Barnes Hut simulation no different from
		   * brute-force forces calculation (each node is considered).
		   */
		  theta: 0.02,

		  /**
		   * Drag force coefficient. Used to slow down system, thus should be less than 1.
		   * The closer it is to 0 the less tight system will be.
		   */
		  dragCoeff: 0.02,

		  /**
		   * Default time step (dt) for forces integration
		   */
		  timeStep : 20
	  });

	  var bodies = [], // Bodies in this simulation.
		  springs = [], // Springs in this simulation.
		  quadTree = createQuadTree(settings),
		  springForce = createSpringForce(settings),
		  dragForce = createDragForce(settings);
		  clickAction = createClickAction(settings);

	  var publicApi = {
		/**
		 * Array of bodies, registered with current simulator
		 *
		 * Note: To add new body, use addBody() method. This property is only
		 * exposed for testing/performance purposes.
		 */
		bodies: bodies,

		/**
		 * Performs one step of force simulation.
		 * @returns {Number} Total movement of the system. Calculated as:
		 *   (total distance traveled by bodies)^2/(total # of bodies)
		 */
		step: function () {
		  accumulateForces();
		  return integrate(bodies, settings.timeStep);
		},

		/**
		 * Adds body to the system
		 * @param {ngraph.physics.primitives.Body} body physical body
		 * @returns {ngraph.physics.primitives.Body} added body
		 */
		addBody: function (body) {
		  bodies.push(body);
		  return body;
		},

		/**
		 * Removes body from the system
		 * @param {ngraph.physics.primitives.Body} body to remove
		 * @returns {Boolean} true if body found and removed. falsy otherwise;
		 */
		removeBody: function (body) {
		  if (!body) { return; }
		  var idx = bodies.indexOf(body);
		  if (idx > -1) {
			bodies.splice(idx, 1);
			return true;
		  }
		},

		/**
		 * Adds a spring to this simulation.
		 * @returns {Object} - a handle for a spring. If you want to later remove
		 * spring pass it to removeSpring() method.
		 */
		addSpring: function (body1, body2, springLength, springWeight, springCoefficient) {
		  if (!body1 || !body2) {
			throw new Error('Cannot add null spring to force simulator');
		  }

		  if (typeof springLength !== 'number') {
			  springLength = -1;
		  }
		  
		  var spring = new Spring(body1, body2, springLength, springCoefficient >= 0 ? springCoefficient : -1, springWeight);
		  springs.push(spring);

		  return spring;
		},

		/**
		 * Removes spring from the system
		 * @param {Object} spring to remove. Spring is an object returned by addSpring
		 * @returns {Boolean} true if spring found and removed. falsy otherwise;
		 */
		removeSpring: function (spring) {
		  if (!spring) { 
			return;
		  }
		  var idx = springs.indexOf(spring);
		  if (idx > -1) {
			springs.splice(idx, 1);
			return true;
		  }
		},

		gravity: function (value) {
		  if (value !== undefined) {
			settings.gravity = value;
			quadTree.options({gravity: value});
			return this;
		  } else {
			return settings.gravity;
		  }
		},

		theta: function (value) {
		  if (value !== undefined) {
			settings.theta = value;
			quadTree.options({theta: value});
			return this;
		  } else {
			return settings.theta;
		  }
		}
	  }

	  // allow settings modification via public API:
	  expose(settings, publicApi);

	  return publicApi;

	  function accumulateForces() {
		// Accumulate forces acting on bodies.
		var body,
			i = bodies.length;

		if (i) {
		  // only add bodies if there the array is not empty:
		  quadTree.insertBodies(bodies); // performance: O(n * log n)
		  while (i--) {
			body = bodies[i];
			body.force.x = 0;
			body.force.y = 0;

			quadTree.updateBodyForce(body);
			dragForce.update(body);
			clickAction.update(body);
		  }
		}

		i = springs.length;
		while(i--) {
			springForce.update(springs[i]);
		}
	  }
	};

},{"./lib/clickAction":13,"./lib/dragForce":14,"./lib/eulerIntegrator":15,"./lib/exposeProperties":16,"./lib/spring":17,"./lib/springForce":18,"ngraph.merge":10,"ngraph.quadtreebh":22}],
13:[function(require,module,exports){
	/**
	 * Represents drag force, which reduces force value on each step by given
	 * coefficient.
	 * @param {Object} options for the drag force
	 * @param {Number=} options.dragCoeff drag force coefficient. 0.1 by default
	 */
	module.exports = function (options) {
	  var mergePropClick = require('ngraph.merge'),
		  exposePropClick = require('./exposeProperties');

	  var apiClick = {
		update : function (body) {
		//  body.force.x -= options.dragCoeff * body.velocity.x;
		//  body.force.y -= options.dragCoeff * body.velocity.y;
		}
	  };

	  // let easy access to dragCoeff:
	  exposePropClick(options, apiClick, ['clickHandle']);
	  return apiClick;
	};
},{"./exposeProperties":16,"ngraph.merge":10}],
14:[function(require,module,exports){
	/**
	 * Represents drag force, which reduces force value on each step by given
	 * coefficient.
	 * @param {Object} options for the drag force
	 * @param {Number=} options.dragCoeff drag force coefficient. 0.1 by default
	 */
	module.exports = function (options) {
	  var merge = require('ngraph.merge'),
		  expose = require('./exposeProperties');

	  options = merge(options, {
		dragCoeff: 0.02,
	  });

	  var graphInSettledState = false;
	  var api = {
		update : function (body) {
			body.force.x -= options.dragCoeff * body.velocity.x;
			body.force.y -= options.dragCoeff * body.velocity.y;	
		}
	  };

	  // let easy access to dragCoeff:
	  expose(options, api, ['dragCoeff']);
	  return api;
	};
},{"./exposeProperties":16,"ngraph.merge":10}],
15:[function(require,module,exports){
	/**
	 * Performs forces integration, using given timestep. Uses Euler method to solve
	 * differential equation (http://en.wikipedia.org/wiki/Euler_method ).
	 * @returns {Number} squared distance of total position updates.
	 */

	module.exports = integrate;

	function integrate(bodies, timeStep) {
	  var dx = 0, tx = 0,
		  dy = 0, ty = 0,
		  i,
		  max = bodies.length;

	  for (i = 0; i < max; ++i) {
		var body = bodies[i],
			coeff = timeStep / body.mass;

		body.velocity.x += coeff * body.force.x;
		body.velocity.y += coeff * body.force.y;
		var vx = body.velocity.x,
			vy = body.velocity.y,
			v = Math.sqrt(vx * vx + vy * vy);

		if (v > 1) {
		  body.velocity.x = vx / v;
		  body.velocity.y = vy / v;
		}

		dx = timeStep * body.velocity.x;
		dy = timeStep * body.velocity.y;

		body.pos.x += dx;
		body.pos.y += dy;

		// TODO: this is not accurate. Total value should be absolute
		tx += dx; ty += dy;
	  }

	  return (tx * tx + ty * ty)/bodies.length;
	}
},{}],
16:[function(require,module,exports){
	module.exports = exposeProperties;
	/**
	 * Augments `target` object with getter/setter functions, which modify settings
	 * @example
	 *  var target = {};
	 *  exposeProperties({ age: 42}, target);
	 *  target.age(); // returns 42
	 *  target.age(24); // make age 24;
	 *
	 *  var filteredTarget = {};
	 *  exposeProperties({ age: 42, name: 'John'}, filteredTarget, ['name']);
	 *  filteredTarget.name(); // returns 'John'
	 *  filteredTarget.age === undefined; // true
	 */
	function exposeProperties(settings, target, filter) {
	  var needsFilter = Object.prototype.toString.call(filter) === '[object Array]';
	  if (needsFilter) {
		for (var i = 0; i < filter.length; ++i) {
		  augment(settings, target, filter[i]);
		}
	  } else {
		for (var key in settings) {
		  augment(settings, target, key);
		}
	  }
	}

	function augment(source, target, key) {
	  if (source.hasOwnProperty(key)) {
		if (typeof target[key] === 'function') {
		  // this accessor is already defined. Ignore it
		  return;
		}
		target[key] = function (value) {
		  if (value !== undefined) {
			source[key] = value;
			return target;
		  }
		  return source[key];
		}
	  }
	}
},{}],
17:[function(require,module,exports){
	module.exports = Spring;
	/**
	 * Represents a physical spring. Spring connects two bodies, has rest length
	 * stiffness coefficient and optional weight
	 */
	function Spring(fromBody, toBody, length, coeff, weight) {
		this.from = fromBody;
		this.to = toBody;
		this.length = length;
		this.coeff = coeff;

		this.weight = typeof weight === 'number' ? weight : 1;
	};
},{}],
18:[function(require,module,exports){
	/**
	 * Represents spring force, which updates forces acting on two bodies, conntected
	 * by a spring.
	 * @param {Object} options for the spring force
	 * @param {Number=} options.springCoeff spring force coefficient.
	 * @param {Number=} options.springLength desired length of a spring at rest.
	 */
	module.exports = function (options) {
	  var merge = require('ngraph.merge');
	  var random = require('ngraph.random').random(42);
	  var expose = require('./exposeProperties');

	  options = merge(options, {
		//springCoeff: 0.0002,
		//springLength: 80
	  });

	  var api = {
		/**
		 * Upsates forces acting on a spring
		 */
		update : function (spring) {
		  var body1 = spring.from,
			  body2 = spring.to;
		  var length = spring.length < 0 ? options.springLength : spring.length;
		  var dx = body2.pos.x - body1.pos.x,
			  dy = body2.pos.y - body1.pos.y,
			  r = Math.sqrt(dx * dx + dy * dy);

		  if (r === 0) {
			  dx = (random.nextDouble() - 0.5) / 50;
			  dy = (random.nextDouble() - 0.5) / 50;
			  r = Math.sqrt(dx * dx + dy * dy);
		  }

		  var d = r - length;
		  var coeff = ((!spring.coeff || spring.coeff < 0) ? options.springCoeff : spring.coeff) * d / r * spring.weight;

		  body1.force.x += coeff * dx;
		  body1.force.y += coeff * dy;

		  body2.force.x -= coeff * dx;
		  body2.force.y -= coeff * dy;
		}
	  };

	  expose(options, api, ['springCoeff', 'springLength']);
	  return api;
	}
},{"./exposeProperties":16,"ngraph.merge":10,"ngraph.random":26}],
19:[function(require,module,exports){
var NODE_WIDTH = 10;

module.exports = function (graph, settings) {
  var merge = require('ngraph.merge');

  // Initialize default settings:
  settings = merge(settings, {
    // Where do we render our graph?
    container: document.body,

    // What is the background color of a graph?
    background: 0x000000,

    // Default physics engine settings
    physics: {
      springLength: 30,
      springCoeff: 0.0008,
      dragCoeff: 0.01,
      gravity: -1.2,
      theta: 1
    }
  });

  // If client does not need custom layout algorithm, let's create default one:
  var layout = settings.layout;

  if (!layout) {
    var createLayout = require('ngraph.forcelayout'),
        physics = require('ngraph.physics.simulator');

    layout = createLayout(graph, physics(settings.physics));
  }

  var width = settings.container.clientWidth,
      height = settings.container.clientHeight;
  var stage = new PIXI.Stage(settings.background, true);
  var renderer = PIXI.autoDetectRenderer(width, height, null, false, true);

  settings.container.appendChild(renderer.view);

  var graphics = new PIXI.Graphics();
  graphics.position.x = width/2;
  graphics.position.y = height/2;
  graphics.scale.x = 1;
  graphics.scale.y = 1;
  stage.addChild(graphics);

  // Default callbacks to build/render nodes
  var nodeUIBuilder = defaultCreateNodeUI,
      nodeRenderer  = defaultNodeRenderer,
      linkUIBuilder = defaultCreateLinkUI,
      linkRenderer  = defaultLinkRenderer;

  // Storage for UI of nodes/links:
  var nodeUI = {}, linkUI = {};

  graph.forEachNode(initNode);
  graph.forEachLink(initLink);

  listenToGraphEvents();

  //This has been made a global variable and its definition has been added in the network file.
  pixiGraphics = {
    /**
     * Allows client to start animation loop, without worrying about RAF stuff.
     */
    run: animationLoop,

    /**
     * For more sophisticated clients we expose one frame rendering as part of
     * API. This may be useful for clients who have their own RAF pipeline.
     */
    renderOneFrame: renderOneFrame,

    /**
     * This callback creates new UI for a graph node. This becomes helpful
     * when you want to precalculate some properties, which otherwise could be
     * expensive during rendering frame.
     *
     * @callback createNodeUICallback
     * @param {object} node - graph node for which UI is required.
     * @returns {object} arbitrary object which will be later passed to renderNode
     */
    /**
     * This function allows clients to pass custom node UI creation callback
     * 
     * @param {createNodeUICallback} createNodeUICallback - The callback that 
     * creates new node UI
     * @returns {object} this for chaining.
     */
    createNodeUI : function (createNodeUICallback) {
      nodeUI = {};
      nodeUIBuilder = createNodeUICallback;
      graph.forEachNode(initNode);
      return this;
    },

    /**
     * This callback is called by pixiGraphics when it wants to render node on
     * a screen.
     *
     * @callback renderNodeCallback
     * @param {object} node - result of createNodeUICallback(). It contains anything
     * you'd need to render a node
     * @param {PIXI.Graphics} ctx - PIXI's rendering context.
     */
    /**
     * Allows clients to pass custom node rendering callback
     *
     * @param {renderNodeCallback} renderNodeCallback - Callback which renders
     * node.
     *
     * @returns {object} this for chaining.
     */
    renderNode: function (renderNodeCallback) {
      nodeRenderer = renderNodeCallback;
      return this;
    },

    /**
     * This callback creates new UI for a graph link. This becomes helpful
     * when you want to precalculate some properties, which otherwise could be
     * expensive during rendering frame.
     *
     * @callback createLinkUICallback
     * @param {object} link - graph link for which UI is required.
     * @returns {object} arbitrary object which will be later passed to renderNode
     */
    /**
     * This function allows clients to pass custon node UI creation callback
     * 
     * @param {createLinkUICallback} createLinkUICallback - The callback that
     * creates new link UI
     * @returns {object} this for chaining.
     */
    createLinkUI : function (createLinkUICallback) {
      linkUI = {};
      linkUIBuilder = createLinkUICallback;
      graph.forEachLink(initLink);
      return this;
    },

    /**
     * This callback is called by pixiGraphics when it wants to render link on
     * a screen.
     *
     * @callback renderLinkCallback
     * @param {object} link - result of createLinkUICallback(). It contains anything
     * you'd need to render a link
     * @param {PIXI.Graphics} ctx - PIXI's rendering context.
     */
    /**
     * Allows clients to pass custom link rendering callback
     *
     * @param {renderLinkCallback} renderLinkCallback - Callback which renders
     * link.
     *
     * @returns {object} this for chaining.
     */
    renderLink: function (renderLinkCallback) {
      linkRenderer = renderLinkCallback;
      return this;
    },

    /**
     * Tries to get node at (x, y) coordinates. By default renderer assumes
     * width and height of the node is 10 pixels. But if your createNodeUICallback
     * returns object with `width` and `height` attributes, they are considered
     * as actual dimensions of a node
     *
     * @param {Number} x - x coordinate
     * @param {Number} y - y coordinate
     * @returns {Object} - acutal graph node located at (x, y) coordinates.
     * If there is no node in that are `undefined` is returned.
     */
    getNodeAt: getNodeAt,
	
	/**
     * Tries to get the link at (x, y) coordinates.
	 * Considers the length and width of the link.
     * @param {Number} x - x coordinate
     * @param {Number} y - y coordinate
     * @returns {Object} - acutal link node located at (x, y) coordinates.
     * If there is no link in that are `undefined` is returned.
     */
	getLinkAt: getLinkAt,

    /**
     * [Read only] Current layout algorithm. If you want to pass custom layout
     * algorithm, do it via `settings` argument of ngraph.pixi.
     */
    layout: layout,

    // TODO: These properties seem to only be required fo graph input. I'd really
    // like to hide them, but not sure how to do it nicely
    domContainer: renderer.view,
    graphGraphics: graphics,
    stage: stage
  };

  // listen to mouse events
  var graphInput = require('./lib/graphInput');
  graphInput(pixiGraphics, layout);

  return pixiGraphics;

///////////////////////////////////////////////////////////////////////////////
// Public API is over
///////////////////////////////////////////////////////////////////////////////

  function animationLoop() {
    layout.step();
    renderOneFrame();
    requestAnimFrame(animationLoop);
  }

  function renderOneFrame() {
    graphics.clear();

    Object.keys(linkUI).forEach(renderLink);
    Object.keys(nodeUI).forEach(renderNode);

    renderer.render(stage);
  }

  function renderLink(linkId) {
    linkRenderer(linkUI[linkId], graphics);
  }

  function renderNode(nodeId) {
    nodeRenderer(nodeUI[nodeId], graphics);
  }

  function initNode(node) {
    var ui = nodeUIBuilder(node);
    // augment it with position data:
    ui.pos = layout.getNodePosition(node.id);
    // and store for subsequent use:
    nodeUI[node.id] = ui;
  }

  function initLink(link) {
    var ui = linkUIBuilder(link);
    ui.from = layout.getNodePosition(link.fromId);
    ui.to = layout.getNodePosition(link.toId);
    linkUI[link.id] = ui;
  }

  function defaultCreateNodeUI(node) {
    return {};
  }

  function defaultCreateLinkUI(link) {
    return {};
  }

  function defaultNodeRenderer(node) {
    var x = node.pos.x - NODE_WIDTH/2,
        y = node.pos.y - NODE_WIDTH/2;

    graphics.beginFill(0xFF3300);
    graphics.drawRect(x, y, NODE_WIDTH, NODE_WIDTH);
  }

  function defaultLinkRenderer(link) {
    graphics.lineStyle(1, 0xcccccc, 1);
    graphics.moveTo(link.from.x, link.from.y);
    graphics.lineTo(link.to.x, link.to.y);
  }

  function getNodeAt(x, y) {
	var half, node, pos, width, half;
    // currently it's a linear search, but nothing stops us from refactoring
    // this into spatial lookup data structure in future:
    for (var nodeId in nodeUI) {
      if (nodeUI.hasOwnProperty(nodeId)) {
		  node = nodeUI[nodeId];
		  pos = node.pos;
          width = node.width || NODE_WIDTH;
		  half = width/2;
        if ((pos.x - half < x) && (x < pos.x + half) && (pos.y - half < y) && (y < pos.y + half)) {
          return graph.getNode(nodeId);
        }
      }
    }
  }

  /**
  * Returns the link object over which the user has mouse hovered.
  **/
  //This function needs to be refactored....Aayush 03/02/2016
  function getLinkAt(x, y) {
    var half = NODE_WIDTH/2;
    // currently it's a linear search, but nothing stops us from refactoring
    // this into spatial lookup data structure in future:
    for (var linkId in linkUI) {
      if (linkUI.hasOwnProperty(linkId)) {
        var ax, ay, bx, by, cx, cy, px, py, rVec, orthoVec, linkDistanceMultiplier = 10;
		link = linkUI[linkId];

		ax = link.from.x;
		ay = link.from.y;
		bx = link.to.x;
		by = link.to.y;
		px = x;
		py = y;
		rVec = VIEWS.SharedFunctionality.getVector(ax,ay,bx,by);
		orthoVec = VIEWS.SharedFunctionality.getNormalizedOrthoVector(rVec.x,rVec.y);
		cx = ((ax + bx)/2) + (orthoVec.y * linkDistanceMultiplier);
		cy = ((ay + by)/2) + (orthoVec.x * linkDistanceMultiplier);
		
		
		if(((cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0) &&
			((ax - px) * (by - py) - (bx - px) * (ay - py) >= 0) &&
			((bx - px) * (cy - py) - (cx - px) * (by - py) >= 0)) {
				return link;
		}
		
		ax = link.to.x;
		ay = link.to.y;
		bx = link.from.x;
		by = link.from.y;
		px = x;
		py = y;
		rVec = VIEWS.SharedFunctionality.getVector(ax,ay,bx,by);
		orthoVec = VIEWS.SharedFunctionality.getNormalizedOrthoVector(rVec.x,rVec.y);
		cx = ((ax + bx)/2) + (orthoVec.y * linkDistanceMultiplier);
		cy = ((ay + by)/2) + (orthoVec.x * linkDistanceMultiplier);
		
		
		if(((cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0) &&
			((ax - px) * (by - py) - (bx - px) * (ay - py) >= 0) &&
			((bx - px) * (cy - py) - (cx - px) * (by - py) >= 0)) {
				return link;
		}
	}
  }
}
  function listenToGraphEvents() {
    graph.on('changed', onGraphChanged);
  }

  function onGraphChanged(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i];
      if (change.changeType === 'add') {
        if (change.node) {
          initNode(change.node);
        }
        if (change.link) {
          initLink(change.link);
        }
      } else if (change.changeType === 'remove') {
        if (change.node) {
          delete nodeUI[change.node.id];
        }
        if (change.link) {
          delete linkUI[change.link.id];
        }
      }
    }
  }
}

},{"./lib/graphInput":21,"ngraph.forcelayout":7,"ngraph.merge":10,"ngraph.physics.simulator":12}],
20:[function(require,module,exports){
/**
 * This module unifies handling of mouse whee event accross different browsers
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel?redirectlocale=en-US&redirectslug=DOM%2FMozilla_event_reference%2Fwheel
 * for more details
 */
module.exports = addWheelListener;

var prefix = "", _addEventListener, onwheel, support;

// detect event model
if ( window.addEventListener ) {
    _addEventListener = "addEventListener";
} else {
    _addEventListener = "attachEvent";
    prefix = "on";
}

// detect available wheel event
support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
          document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
          "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

function addWheelListener( elem, callback, useCapture ) {
    _addWheelListener( elem, support, callback, useCapture );

    // handle MozMousePixelScroll in older Firefox
    if( support == "DOMMouseScroll" ) {
        _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
    }
};

function _addWheelListener( elem, eventName, callback, useCapture ) {
    elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
        !originalEvent && ( originalEvent = window.event );

        // create a normalized event object
        var event = {
            // keep a ref to the original event object
            originalEvent: originalEvent,
            target: originalEvent.target || originalEvent.srcElement,
            type: "wheel",
            deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
            deltaX: 0,
            delatZ: 0,
            preventDefault: function() {
                originalEvent.preventDefault ?
                    originalEvent.preventDefault() :
                    originalEvent.returnValue = false;
            }
        };

        // calculate deltaY (and deltaX) according to the event
        if ( support == "mousewheel" ) {
            event.deltaY = - 1/40 * originalEvent.wheelDelta;
            // Webkit also support wheelDeltaX
            originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
        } else {
            event.deltaY = originalEvent.detail;
        }

        // it's time to fire the callback
        return callback( event );

    }, useCapture || false );
}


/***** Region Begins - Investigation Code for graph expand*****/
function beginAddNodesLoop(graph){
  var i = 0, m = 10, n = 50;
  var addInterval = setInterval(function(){
    graph.beginUpdate();

    for (var j = 0; j < m; ++j){
      var node = i + j * n;
      if (i > 0) { graph.addLink(node, i - 1 + j * n); }
      if (j > 0) { graph.addLink(node, i + (j - 1) * n); }
    }
    i++;
    graph.endUpdate();

    if (i >= n) {
      clearInterval(addInterval);
      setTimeout(function() {
          beginRemoveNodesLoop(graph);
      }, 10000);
    }
  }, 100);
}
/***** Region Ends - Investigation Code*****/
},{}],
21:[function(require,module,exports){
/**
 * Tracks mouse input and updates pixi graphics (zoom/pan).
 *
 * Note: I don't really like how this module is tightly coupled with graphics.
 * If you have dieas how to make this copuling loose, please let me know!
 */
module.exports = function (graphics, layout) {
  var addWheelListener = require('./addWheelListener');
  var graphGraphics = graphics.graphGraphics;

  addWheelListener(graphics.domContainer, function (e) {
    zoomHanlder(e.clientX, e.clientY, e.deltaY < 0);
  });

  addDragListener();

  var getGraphCoordinates = (function () {
    var ctx = {
      global: { x: 0, y: 0} // store it inside closure to avoid GC pressure
    };

    return function (x, y) {
      ctx.global.x = x; ctx.global.y = y;
      //return PIXI.InteractionData.prototype.getLocalPosition.call(ctx, graphGraphics);
	  return PIXI.interaction.InteractionData.prototype.getLocalPosition.call(ctx, graphGraphics);
    }
  }());

  //This function is also stored in a global variable so that the zoom can be accessed from the node search.
  zoomHanlder = function zoom(x, y, isZoomIn) {
    direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    graphGraphics.scale.x *= factor;
    graphGraphics.scale.y *= factor;

    // Technically code below is not required, but helps to zoom on mouse
    // cursor, instead center of graphGraphics coordinates
    var beforeTransform = getGraphCoordinates(x, y);
    graphGraphics.updateTransform();
    var afterTransform = getGraphCoordinates(x, y);

    graphGraphics.position.x += (afterTransform.x - beforeTransform.x) * graphGraphics.scale.x;
    graphGraphics.position.y += (afterTransform.y - beforeTransform.y) * graphGraphics.scale.y;
    graphGraphics.updateTransform();
  }

  function addDragListener() {
    var stage = graphics.stage;
    stage.interactive = true;
	stage.interaction = true;
	
    var isDragging = false, nodeUnderCursor, prevX, prevY;
	
	var checkforDoubleClick = undefined;
    stage.mousedown = function (moveData) {
		var pos = moveData.data.global;
		var graphPos = getGraphCoordinates(pos.x, pos.y);
		nodeUnderCursor = graphics.getNodeAt(graphPos.x, graphPos.y);
		
		if(checkforDoubleClick !== undefined && checkforDoubleClick === nodeUnderCursor) {
			var obj = undefined;
			//This is just an inital ...it needs to be optimized becasue this approach will take n^2 time.
			for(var i = 0; i < updatedList.length; i++) {
				var item = updatedList[i];
				if(item.source === nodeUnderCursor.id || item.target === nodeUnderCursor.id) {
					obj = item;
					break;
				}
			}
			
			if(obj !== undefined) {
					if(obj.Bucket !== undefined) {
						if(!obj.expanded) {
							obj.expanded = true;
						for(var j = 0; j < obj.Bucket.length; j++) {
							var link = obj.Bucket[j];
							g.addLink(link.source, link.target,link,nodes);
						}
					}
				}
			}
		}
		else if (nodeUnderCursor) {
		  checkforDoubleClick = nodeUnderCursor;
		  layout.pinNode(nodeUnderCursor, true);
		}

		prevX = pos.x; prevY = pos.y;
		isDragging = true;
    };
	/**
	*	Handles the mousemove for the graph.
	*	All the graph mouse 'move' actions are handled in this method.
	**/
	stage.mousemove = function (moveData) {
		var pos = moveData.data.global;
		var graphPos = getGraphCoordinates(pos.x, pos.y);
		//Show the tool tips only if the user is not perf
		if(!isDragging) {
			var nodeHO = graphics.getNodeAt(graphPos.x, graphPos.y);
			var linkHO = graphics.getLinkAt(graphPos.x, graphPos.y);
			if (nodeHO) {
				NETWORK.TOOLTIP.showToolTip(nodeHO.data, pos, NETWORK.RULES.nodeToolTip);
			}
			else if(linkHO) {
				NETWORK.TOOLTIP.showToolTip(linkHO.data, pos, NETWORK.RULES.edgeToolTip);
			}
			else {
				NETWORK.TOOLTIP.hideToolTip();
			}
		}
		else {
			if (nodeUnderCursor) {
				layout.setNodePosition(nodeUnderCursor.id, graphPos.x, graphPos.y);
			} 
			else {
				var dx = pos.x - prevX;
				var dy = pos.y - prevY;
				prevX = pos.x; prevY = pos.y;
				graphGraphics.position.x += dx;
				graphGraphics.position.y += dy;
			}
		}
	};
	
    stage.mouseup = function (moveDate) {
      isDragging = false;
      if (nodeUnderCursor) {
        draggingNode = null;
        layout.pinNode(nodeUnderCursor, false);
      }
    };
  }
}

},{"./addWheelListener":20}],
22:[function(require,module,exports){
/**
 * This is Barnes Hut simulation algorithm. Implementation
 * is adopted to non-recursive solution, since certain browsers
 * handle recursion extremly bad.
 *
 * http://www.cs.princeton.edu/courses/archive/fall03/cs126/assignments/barnes-hut.html
 */

module.exports = function (options) {
    options = options || {};
    options.gravity = typeof options.gravity === 'number' ? options.gravity : -1;
    options.theta = typeof options.theta === 'number' ? options.theta : 0.8;

    var Node = require('./node'),
        InsertStack = require('./insertStack'),
        isSamePosition = require('./isSamePosition');

    var gravity = options.gravity,
        updateQueue = [],
        insertStack = new InsertStack(),
        theta = options.theta,

        nodesCache = [],
        currentInCache = 0,
        newNode = function () {
            // To avoid pressure on GC we reuse nodes.
            var node = nodesCache[currentInCache];
            if (node) {
                node.quads[0] = null;
                node.quads[1] = null;
                node.quads[2] = null;
                node.quads[3] = null;
                node.body = null;
                node.mass = node.massX = node.massY = 0;
                node.left = node.right = node.top = node.bottom = 0;
            } else {
                node = new Node();
                nodesCache[currentInCache] = node;
            }

            ++currentInCache;
            return node;
        },

        root = newNode(),

        // Inserts body to the tree
        insert = function (newBody) {
            insertStack.reset();
            insertStack.push(root, newBody);

            while (!insertStack.isEmpty()) {
                var stackItem = insertStack.pop(),
                    node = stackItem.node,
                    body = stackItem.body;

                if (!node.body) {
                    // This is internal node. Update the total mass of the node and center-of-mass.
                    var x = body.pos.x;
                    var y = body.pos.y;
                    node.mass = node.mass + body.mass;
                    node.massX = node.massX + body.mass * x;
                    node.massY = node.massY + body.mass * y;

                    // Recursively insert the body in the appropriate quadrant.
                    // But first find the appropriate quadrant.
                    var quadIdx = 0, // Assume we are in the 0's quad.
                        left = node.left,
                        right = (node.right + left) / 2,
                        top = node.top,
                        bottom = (node.bottom + top) / 2;

                    if (x > right) { // somewhere in the eastern part.
                        quadIdx = quadIdx + 1;
                        var oldLeft = left;
                        left = right;
                        right = right + (right - oldLeft);
                    }
                    if (y > bottom) { // and in south.
                        quadIdx = quadIdx + 2;
                        var oldTop = top;
                        top = bottom;
                        bottom = bottom + (bottom - oldTop);
                    }

                    var child = node.quads[quadIdx];
                    if (!child) {
                        // The node is internal but this quadrant is not taken. Add
                        // subnode to it.
                        child = newNode();
                        child.left = left;
                        child.top = top;
                        child.right = right;
                        child.bottom = bottom;
                        child.body = body;

                        node.quads[quadIdx] = child;
                    } else {
                        // continue searching in this quadrant.
                        insertStack.push(child, body);
                    }
                } else {
                    // We are trying to add to the leaf node.
                    // We have to convert current leaf into internal node
                    // and continue adding two nodes.
                    var oldBody = node.body;
                    node.body = null; // internal nodes do not cary bodies

                    if (isSamePosition(oldBody.pos, body.pos)) {
                        // Prevent infinite subdivision by bumping one node
                        // anywhere in this quadrant
                        if (node.right - node.left < 1e-8) {
                            // This is very bad, we ran out of precision.
                            // if we do not return from the method we'll get into
                            // infinite loop here. So we sacrifice correctness of layout, and keep the app running
                            // Next layout iteration should get larger bounding box in the first step and fix this
                            return;
                        }
                        do {
							var offset = 0;
                            var dx = (node.right - node.left) * offset;
                            var dy = (node.bottom - node.top) * offset;

                            oldBody.pos.x = node.left + dx;
                            oldBody.pos.y = node.top + dy;
                            // Make sure we don't bump it out of the box. If we do, next iteration should fix it
                        } while (isSamePosition(oldBody.pos, body.pos));

                    }
                    // Next iteration should subdivide node further.
                    insertStack.push(node, oldBody);
                    insertStack.push(node, body);
                }
           }
        },

        update = function (sourceBody) {
            var queue = updateQueue, v, dx, dy, r, queueLength = 1, shiftIdx = 0, pushIdx = 1;

            queue[0] = root;

            while (queueLength) {
                var node = queue[shiftIdx],
                    body = node.body;

                queueLength -= 1;
                shiftIdx += 1;
                // technically there should be external "if (body !== sourceBody) {"
                // but in practice it gives slightghly worse performance, and does not
                // have impact on layout correctness
                if (body && body !== sourceBody) {
                    // If the current node is a leaf node (and it is not source body),
                    // calculate the force exerted by the current node on body, and add this
                    // amount to body's net force.
                    dx = body.pos.x - sourceBody.pos.x;
                    dy = body.pos.y - sourceBody.pos.y;
                    r = Math.sqrt(dx * dx + dy * dy);
                    if (r === 0) {
                        // Poor man's protection against zero distance.
						Math.Random
                        /*dx = (random.nextDouble() - 0.5) / 50;
                        dy = (random.nextDouble() - 0.5) / 50;
                        r = Math.sqrt(dx * dx + dy * dy);*/
						
						dx = (Math.random() - 0.5) / 50;
                        dy = (Math.random() - 0.5) / 50;
                        r = Math.sqrt(dx * dx + dy * dy);
                    }
                    // This is standard gravition force calculation but we divide
                    // by r^3 to save two operations when normalizing force vector.
                    v = gravity * body.mass * sourceBody.mass / (r * r * r);
                    sourceBody.force.x += v * dx;
                    sourceBody.force.y += v * dy;
                } else {
                    // Otherwise, calculate the ratio s / r,  where s is the width of the region
                    // represented by the internal node, and r is the distance between the body
                    // and the node's center-of-mass
                    dx = node.massX / node.mass - sourceBody.pos.x;
                    dy = node.massY / node.mass - sourceBody.pos.y;
                    r = Math.sqrt(dx * dx + dy * dy);

                    if (r === 0) {
                        // Sorry about code duplucation. I don't want to create many functions
                        // right away. Just want to see performance first.
						console.log("101112");
						
						dx = (Math.random() - 0.5) / 50;
                        dy = (Math.random() - 0.5) / 50;
                        //dx = (random.nextDouble() - 0.5) / 50;
                        //dy = (random.nextDouble() - 0.5) / 50;
                        r = Math.sqrt(dx * dx + dy * dy);
                    }
                    // If s / r < θ, treat this internal node as a single body, and calculate the
                    // force it exerts on body b, and add this amount to b's net force.
                    if ((node.right - node.left) / r < theta) {
                        // in the if statement above we consider node's width only
                        // because the region was squarified during tree creation.
                        // Thus there is no difference between using width or height.
                        v = gravity * node.mass * sourceBody.mass / (r * r * r);
                        sourceBody.force.x += v * dx;
                        sourceBody.force.y += v * dy;
                    } else {
                        // Otherwise, run the procedure recursively on each of the current node's children.

                        // I intentionally unfolded this loop, to save several CPU cycles.
                        if (node.quads[0]) { queue[pushIdx] = node.quads[0]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[1]) { queue[pushIdx] = node.quads[1]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[2]) { queue[pushIdx] = node.quads[2]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[3]) { queue[pushIdx] = node.quads[3]; queueLength += 1; pushIdx += 1; }
                    }
                }
            }
        },

        insertBodies = function (bodies) {
            var x1 = Number.MAX_VALUE,
                y1 = Number.MAX_VALUE,
                x2 = Number.MIN_VALUE,
                y2 = Number.MIN_VALUE,
                i,
                max = bodies.length;

            // To reduce quad tree depth we are looking for exact bounding box of all particles.
            i = max;
            while (i--) {
                var x = bodies[i].pos.x;
                var y = bodies[i].pos.y;
                if (x < x1) { x1 = x; }
                if (x > x2) { x2 = x; }
                if (y < y1) { y1 = y; }
                if (y > y2) { y2 = y; }
            }

            // Squarify the bounds.
            var dx = x2 - x1,
                dy = y2 - y1;
            if (dx > dy) { y2 = y1 + dx; } else { x2 = x1 + dy; }

            currentInCache = 0;
            root = newNode();
            root.left = x1;
            root.right = x2;
            root.top = y1;
            root.bottom = y2;

            i = max - 1;
            if (i > 0) {
              root.body = bodies[i];
            }
            while (i--) {
                insert(bodies[i], root);
            }
        };

    return {
        insertBodies : insertBodies,
        updateBodyForce : update,
        options : function (newOptions) {
            if (newOptions) {
                if (typeof newOptions.gravity === 'number') { gravity = newOptions.gravity; }
                if (typeof newOptions.theta === 'number') { theta = newOptions.theta; }

                return this;
            }

            return {gravity : gravity, theta : theta};
        }
    };
};

},{"./insertStack":23,"./isSamePosition":24,"./node":25,"ngraph.random":26}],23:[function(require,module,exports){
module.exports = InsertStack;

/**
 * Our implmentation of QuadTree is non-recursive (recursion handled not really
 * well in old browsers). This data structure represent stack of elemnts
 * which we are trying to insert into quad tree. It also avoids unnecessary
 * memory pressue when we are adding more elements
 */
function InsertStack () {
    this.stack = [];
    this.popIdx = 0;
}

InsertStack.prototype = {
    isEmpty: function() {
        return this.popIdx === 0;
    },
    push: function (node, body) {
        var item = this.stack[this.popIdx];
        if (!item) {
            // we are trying to avoid memory pressue: create new element
            // only when absolutely necessary
            this.stack[this.popIdx] = new InsertStackElement(node, body);
        } else {
            item.node = node;
            item.body = body;
        }
        ++this.popIdx;
    },
    pop: function () {
        if (this.popIdx > 0) {
            return this.stack[--this.popIdx];
        }
    },
    reset: function () {
        this.popIdx = 0;
    }
};

function InsertStackElement(node, body) {
    this.node = node; // QuadTree node
    this.body = body; // physical body which needs to be inserted to node
}

},{}],
24:[function(require,module,exports){
module.exports = function isSamePosition(point1, point2) {
    var dx = Math.abs(point1.x - point2.x);
    var dy = Math.abs(point1.y - point2.y);

    return (dx < 1e-8 && dy < 1e-8);
};

},{}],
25:[function(require,module,exports){
/**
 * Internal data structure to represent 2D QuadTree node
 */
module.exports = function Node() {
  // body stored inside this node. In quad tree only leaf nodes (by construction)
  // contain boides:
  this.body = null;

  // Child nodes are stored in quads. Each quad is presented by number:
  // 0 | 1
  // -----
  // 2 | 3
  this.quads = [];

  // Total mass of current node
  this.mass = 0;

  // Center of mass coordinates
  this.massX = 0;
  this.massY = 0;

  // bounding box coordinates
  this.left = 0;
  this.top = 0;
  this.bottom = 0;
  this.right = 0;

  // Node is internal when it is not a leaf
  this.isInternal = false;
};

},{}],
26:[function(require,module,exports){
module.exports = {
  random: random,
};

/**
 * Creates seeded PRNG with two methods:
 *   next() and nextDouble()
 */
function random(inputSeed) {
  var seed = typeof inputSeed === 'number' ? inputSeed : (+ new Date());
  var randomFunc = function() {
      // Robert Jenkins' 32 bit integer hash function.
      seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
      seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
      seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
      seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
      seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
      seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
      return (seed & 0xfffffff) / 0x10000000;
  };

  return {
      /**
       * Generates random integer number in the range from 0 (inclusive) to maxValue (exclusive)
       *
       * @param maxValue Number REQUIRED. Ommitting this number will result in NaN values from PRNG.
       */
      next : function (maxValue) {
          return Math.floor(randomFunc() * maxValue);
      },

      /**
       * Generates random double number in the range from 0 (inclusive) to 1 (exclusive)
       * This function is the same as Math.random() (except that it could be seeded)
       */
      nextDouble : function () {
          return randomFunc();
      }
  };
}

},{}],

},{},[1])(1)
});