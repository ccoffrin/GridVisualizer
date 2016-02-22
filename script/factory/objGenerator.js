//No separate namespace has been  created for the Object Factory class as the NETWORK OBJECT should itself have an Object Factory that generates and/or updates the DOs.
//The parsing rules used to create the objects are defined in the parserRules.js FILE.
(function(){
	NETWORK.ObjectFactory = function () {
		var DO = this.DO(this.infoForObjectGeneration());
		this.updateNodeData(DO);
		
		this.addgenCostData(DO);
		this.updateEdgesData(DO);
		//this.updateClusterBuckets(DO);
		
		//Sorting the voltage array.
		function sortNumber(a,b) {
			return b - a;
		}
		NETWORK.distinctVoltages.sort(sortNumber);
		this.performNodeColorMapping();
		
		this.getDO = function() {
			return DO;
		};

	};

	/**
	* Creates the master array of objects used for further calculation and network analysis.
	* @param	JSONString		The JSON string that is generated by parsing the input file based on specified set of rules.
	* @return 	The master object containing all the relevant Network object.**/
	NETWORK.ObjectFactory.prototype.DO = function(JSONString) {
		var infoObject = JSON.parse(JSONString);
		var nC = [];
		for(item in infoObject)
		{
			switch(infoObject[item].name)
			{
				case 'AreaData':
					var areaDO = this.generateDO(infoObject[item]);
					nC["areaData"] = areaDO;
				break;	
				case 'BusData':
					var busDO = this.generateDO(infoObject[item]);
					nC["busDO"] = busDO;
				break;
				case 'genData':
					var genDO = this.generateDO(infoObject[item]);
					nC["genDO"] = genDO;
				break;
				case 'genCostData':
					var genCostData= this.generateDO(infoObject[item]);
					nC["genCostDO"] = genCostData;
				break;
				case 'BranchData':
					var branchDO = this.generateDO(infoObject[item]);
					nC["branchDO"] = branchDO;
				break;
				case 'BusLocation':
					var busLocation = this.generateDO(infoObject[item]);
					nC["busLocation"] = busLocation;
				break;
				case 'BaseMVA':
					//ADD support for global data objects.
					nC["BaseMVA"] = this.beautifyValue((this.getObjectContent(infoObject[item])).toString().split("=")[1]);
				break;
				default:
				break;
			}
		}
		return nC;	
	};
		
	/**
		*	Gets the information regarding the generation of the objects i.e. the starting and the ending character of the object data in the passed text.
		*	@param	No direct param but it makes use of the global FILE object.
		*	@return		A json string containing all the information regarding the object creation (i.e. its name, beginning character and ending character).**/
	NETWORK.ObjectFactory.prototype.infoForObjectGeneration = function() {
		var _lb = NETWORK.RULES.parser.ObjectIdentifiers.BeginningData;
		var _le = NETWORK.RULES.parser.ObjectIdentifiers.EndingData;
		var allObjectInfo = [];
		
		for(key in _lb) {
				var s = _lb[key], bl, l;
				//Check for all the rules for an object - one at a time.
				for(var i = 0; i < s.length ; i++) {
					if(FILE.search(s[i].toString()) !== -1) {
						
						//Based on the line on which the data is found we make use of the line gap.
						if(i === 1) {	l = 2;	}
						else {	l = 1;	}
						bl = FILE.search(s[i]);
						var e = FILE.indexOf(_le[key],bl);
						
						var b = true;
						//Validation needs to be added for all the elements - Currently only handling for the Bus Location Data - Issue reported by Barry Rawn.
						//The header were not found - set the 'isPropNamesPresent' variable to false so that custom handling can be done while populating the data object.
						if(s[i].toString() === "mpc.buslocation = \\[") {
							b = false;
							l = 0;
						}
						
						var objInfo = { "name" : key, "beginChar": bl, "endChar": e,"lineGap":l,"isPropNamesPresent":b }
						allObjectInfo.push(objInfo);
						
						//break the loop as soon the data for an object is found
						break;
				}
			}
		}
		
		//JSON has been kept as the return type for modularity.
		return JSON.stringify(allObjectInfo);
	};
		
	/** 
	* Generates the useful Data Objects for the Network. All the data objects except the gen cost data object are parsed using this function.
	* @param	rawDO		The raw data object which is created by parsing the text file based on the specific set of rules.
	* @return		The actual (useful) data object for the network simulation.
	**/
	NETWORK.ObjectFactory.prototype.generateDO = function(rawDO){
		var DOWrapper = {};
		var dOL = [];
		DOWrapper.dOL = dOL;
		var content = this.getObjectContent(rawDO);
		var oP, i, s, c, propIndexer, aDO, eOD, vI, sI;
		var o = NETWORK.RULES.parser.startIndexIdentifire;
		//The object name is used to identify the name of the properties.
		oP = NETWORK.RULES.parser.HardCodedDefaultProperties[rawDO.name];
		
		//Dynamically finding the starting point of the data and then  parsing the data object from there on.
		for(i = 0; i < content.length; i++) {
			s = content[i].toString().replace(/(\r\n|\n|\r)/gm,"");
			if(o.indexOf(s.substring(0, s.indexOf("[") + 1)) !== -1) {
				sI = ++i;
				//content.length-1 has been taken because the index starts from 0 whereas the length is calculated from 1.
				for(vI = sI; vI < (content.length-1); vI++)
				{
					c = $.trim(content[vI]);
					
					//Updated the condition for the content parsing to include the check for the '%' in the line. The parsing is done only if the first element in the line is not %.
					if((c !== "") && (c.indexOf("%") !== 0)) {
						if(c.indexOf(' ') !== -1) {
							c = c.replace(/\s{1,}/g, '\t');
						}
						eOD = c.split('\t');
						aDO = {};
						
						//Special Handling for the gen cost data object.
						if(rawDO.name === "genCostData") {
							if(parseInt(eOD[3]) === 2) {
								//The object name is used to identify the name of the properties.
								oP = NETWORK.RULES.parser.HardCodedDefaultProperties["genCostDataLinear"];
							}
						}
						
						for(pI = 0; pI < oP.length; pI++)
						{
							aDO[oP[pI]] = this.beautifyValue((eOD[pI]).toString());
						}
						DOWrapper.dOL.push(aDO);
					}		
				}
				break;
			}
		}		
		return DOWrapper;
	};
	
	/**
	* Gets the relevant string array for a raw Data Object passed.
	* @param	rawDO		The data object that contains the required information for creating a Useful Data Object.
	* @return	The array of strings containing the relevant information regarding the specific network object.
	**/
	NETWORK.ObjectFactory.prototype.getObjectContent = function(rawDO) {
		return(FILE.substring(rawDO.beginChar,(rawDO.endChar + 2)).split('\n'));
	};
	
	/**
	*	Adds the following to the bus object -
	* 	1. Top Decorators i.e. the generators information and the generator list.
	*	2. Bottom decorators i.e. the Load and Shunt.
	*	3. Updates the status of the bus using the Rule - If the bus type is 4 then the status of the bus is 0 i.e. off.
	*	4. Creates the nodeEdgeMap for the Network node.
	*	param n - The Network data object containing all the data objects used to populate the graph.
	*	All these functionalities were in separate methods but now have been combined into one in order to avoid multiple looping over the nodes (for large graphs).
	**/
	NETWORK.ObjectFactory.prototype.updateNodeData = function(n) {
		var nMap = {}, bO, tD = [], tdI="", i, j, gO, aDo, id, b, lObj, sObj;
		for(i = 0; i < n.busDO.dOL.length; i++) {
			nMap[n.busDO.dOL[i].bus_i] = i;
			
			bO = n.busDO.dOL[i];
			/***** Region Begins Top Decorators and Generators*****/
			//As of now only the ID is added to the gen data object - the data added needs to updated. - 16/12/2014.
			
			for(j = 0; j < n.genDO.dOL.length; j++) {
				gO = n.genDO.dOL[j];
				if(gO.bus === bO.bus_i) {
					//As the values are dynamically assigned thus declaring the object outside the for loop will cause a reference error and only the value of the last object will be stored.
					aDO = { };
					id = (j+1);
					aDO["id"] = id;
					gO["Pd"] = bO.Pd;
					gO["Qd"] = bO.Qd;
					gO["id"] = id;
					tdI = tdI + id +",";
					if(parseInt(gO.Pmax) === 0 && parseInt(gO.Pmin) === 0)  {
						aDO["type"] = "synCondensor";
						aDO["text"] = "c";
					}
					else {
						aDO["type"] = "gen";
						aDO["text"] = "~";
					}
					//Adding the DOMID to the top decorators. - This is the id of the top decorator group.
					gO["DOMID"] = ("bus" + bO.bus_i + "topDeco");
					//Also the same DOMID is added to the decorator group element so as to avoid any error. (in future code implementation).
					tD["DOMID"] = ("bus" + bO.bus_i + "topDeco");
					
					aDO["topDecoData"] = gO;
					
					tD.push(aDO);
				}
			}
			bO["topDecorators"] = tD;
			bO["GenIdList"] = tdI.slice(0,-1);
			/***** Region Ends for Top Decorators *****/
			
			/***** Region for Bottom Decorators *****/
			b = [];
			if((parseFloat(bO.Pd) !== 0.0) || (parseFloat(bO.Qd) !== 0.0)) {
				////busType = load;
				lObj = {};
				lObj["type"] = "load";
				lObj["Pd"] = bO.Pd;
				lObj["Qd"] = bO.Qd;
				lObj["Gs"] = bO.Gs;
				lObj["Bs"] = bO.Bs;
				//Adding the DOMID to the bottom decorator - this refers to the ID of the bottom group element.
				lObj["DOMID"] = ("bus" + bO.bus_i + "bottomDeco");
				b.push(lObj);
			}
			
			if((parseFloat(bO.Gs) !== 0.0) || (parseFloat(bO.Bs) !== 0.0)) {
				//busType = "shunt";
				sObj = {};
				sObj["type"] = "shunt";
				sObj["Pd"] = bO.Pd;
				sObj["Qd"] = bO.Qd;
				sObj["Gs"] = bO.Gs;
				sObj["Bs"] = bO.Bs;
				//Adding the DOMID to the bottom decorator - this refers to the ID of the bottom group element.
				sObj["DOMID"] = ("bus" + bO.bus_i + "bottomDeco");
				b.push(sObj);
			}	
			//Adding the DOMID to the bottom decorator group
			b["DOMID"] = ("bus" + bO.bus_i + "bottomDeco");
			bO["bottomDecorators"] = b;
			/***** Region Ends - Bottom Decorators *****/
			
			/***** Region Begins - Update Bus Status *****/
			if(bO.type === "4") { bO["status"] = 0; }
			else { bO["status"] = 1; }
			/***** Region Ends - Update Bus Status *****/
		}
		
		//Adding Node Branch Map to the NETWORK - This has been added to NETWORK because once created it is independent of the Data Object
		NETWORK["nodeEdgeMap"] = nMap;
	};

	/**
	*	Adds gen cost data to the gen Objects.
	*	Acts as a post processing function over the data objects that are formed.
	*
	**/
	NETWORK.ObjectFactory.prototype.addgenCostData = function(DOs) {
		var boolIgnoreCostData = false;
		var bICDL = false;
		
		//Ignore the gen cost if it is not present in the file.
		if(typeof DOs.genCostDO !== 'undefined') {
			//As advised by Dr. Carleton - In some cases the matrix mpc.gencost with have two lines for each gen If that is the case, the parser should raise a warning.
			//The following check has been added to cater to this need.
			if(DOs.genDO.dOL.length !== DOs.genCostDO.dOL.length) {
				bICDL = true;
				//alert("Warning: this test case has cost values on reactive power generation that are not displayed by this tool.");
			}
			
			/*As advised by Dr. Carleton - The current implementation only supports quadratic cost functions in the mpc.gencost matrix, not PWL cost functions.
				When reading mpc.gencost matrix it should check that the first value of each line is "2". If not, then it should print a warning that the cost data is being ignored. Cost 1, Cost 2, and Cost 3 on the gens should appear as something like "NA" or a dash "-".
				If one gen is of type 1 all of them will be of type 1, thus checking only the first one.
				Also as this is common for all gens only one warning message is shown to the user when the file is loaded*/
				if(DOs.genCostDO.dOL[0].GenID === "1") {
					boolIgnoreCostData = true;
					//alert("Warning: the piecewise linear gen cost functions in this test case are not displayed by this tool.");
				}
			

			//Loop Across the gen Cost Object to update the gen Data object with the relevant cost info.	
			for(var i = 0; i < DOs.genDO.dOL.length; i++) {
				//Data is added per the value of the variables set based on the new validation logic added.
				(DOs.genDO.dOL[i])["costData"] = (DOs.genCostDO.dOL[i]);
				if(boolIgnoreCostData) {
					(DOs.genDO.dOL[i]).costData["ignoreCostData"] = "true";
					(DOs.genDO.dOL[i]).costData.cost1 = "-";
					(DOs.genDO.dOL[i]).costData.cost2 = "-";
					(DOs.genDO.dOL[i]).costData.cost3 = "-";
		
				}
				else {
					(DOs.genDO.dOL[i]).costData["ignoreCostData"] = "false";
				}
				
				if(bICDL) {
					(DOs.genDO.dOL[i]).costData["bICDL"] = "true";
				}
				else {
					(DOs.genDO.dOL[i]).costData["bICDL"] = "false";
				}
			}
		}
		else 
		{
			boolIgnoreCostData = true;
			bICDL = true;
			//Loop Across the gen Cost Object to update the gen Data object so that all the ignoring variables are set to true - to avoid crash in validation or tool-tip.
			for(var i = 0; i < DOs.genDO.dOL.length; i++) {
				//Data is added per the value of the variables set based on the new validation logic added.
				(DOs.genDO.dOL[i])["costData"] = [];
				(DOs.genDO.dOL[i]).costData["ignoreCostData"] = "true";
				(DOs.genDO.dOL[i]).costData.cost1 = "-";
				(DOs.genDO.dOL[i]).costData.cost2 = "-";
				(DOs.genDO.dOL[i]).costData.cost3 = "-";
				(DOs.genDO.dOL[i]).costData["bICDL"] = "false";
			}
		}
	};

	/**
	*	Updated the branch data object with the attributes like - Source/Target Node Data, Name, Type, isMultiLine Status etc.
	*	Also adds the Node Edge Map to the NETWORK - This information once generated is independent of the Data Objects thus not attached in the Data Objects.
	*/
	NETWORK.ObjectFactory.prototype.updateEdgesData = function(n) {
		var edges = {}, nodeObjectMap = {}, edgeMapForMultiLine = [];
		
		for (i = 0; i < n.branchDO.dOL.length; i++) {
			var e = n.branchDO.dOL[i];			
			
			var et = "Standard";
			if(parseFloat(e.ratio) !== 0.0 || parseFloat(e.angle) !== 0.0) {	et = "Transformer";	}
			else if(parseFloat(e.b) !== 0.0){	et = "LineCharge";	}
			
			var er = 1, m = false;
			var en = e.fbus + "-" + e.tbus + "-" + e.tbus + "-" + e.fbus + "-" + er;
			
			//Checking if the name of the edge has already been added to the array.
			if($.inArray(en,edgeMapForMultiLine) !== -1) {
				m = true;
				//Setting Multi line true for all previous repetitive edges.
				Object.keys(edges).forEach(function(key, index) {
					if(key.slice(0, - 2) === en.slice(0, - 2)) {
						this[key].m = m;
						er++;
					}
				}, edges);
				en = en.slice(0, - 2);	
				en = en + "-" + er;
			}
			edgeMapForMultiLine.push(en);
		

			/***** Region Begins - Add Thermal Rating to the edge *****/
				var delta, cosDel, sb, tb, srcVmSq, trgVmSq, ySquared, equSecPart, V1, V2, UB,ew;
				delta = Math.max(parseFloat(e.angmin),parseFloat(e.angmax));
				if(delta > 90) { cosDel = 0;	}
				else {	cosDel = Math.cos(delta * (Math.PI / 180));	}
				
				sb = n.busDO.dOL[NETWORK.nodeEdgeMap[e.fbus]];
				tb =  n.busDO.dOL[NETWORK.nodeEdgeMap[e.tbus]];
				srcVmSq = Math.pow(parseFloat(sb.Vmax),2);
				trgVmSq = Math.pow(parseFloat(tb.Vmax),2);
				ySquared = (1/((Math.pow(parseFloat(e.r),2)) + (Math.pow(parseFloat(e.x),2))));
				equSecPart = (srcVmSq + trgVmSq - (2 * sb.Vmax * tb.Vmax * cosDel));
				V1 = Math.abs(srcVmSq * equSecPart * ySquared);
				V2 = Math.abs(trgVmSq * equSecPart * ySquared);
				UB = Math.sqrt(Math.max(V1,V2)) * parseFloat(n.BaseMVA);
				e["UB"]  = UB;
			/***** Region Ends - Add Thermal Rating to the edge *****/
		

			//Added to update the value of rateA if it is zero - As advised by Dr. Carleton		
			if(e.rateA === "0") {
				e["rateAToolTip"] = "none";
				e["rateBToolTip"] = "none";
				e["rateCToolTip"] = "none";
			}
			else {
				e["rateAToolTip"] = e.rateA;
				e["rateBToolTip"] = e.rateB;
				e["rateCToolTip"] = e.rateC;
			}
			var ew = Math.sqrt((1/((e.r * e.r) + (e.x * e.x))));
			edges[en] = { "index":i + 1, "edgeId" : ("From Bus '" + e.fbus + "' to Bus '" + e.tbus +"'"), "source": NETWORK.nodeEdgeMap[e.fbus], "target": NETWORK.nodeEdgeMap[e.tbus], "edgeData" : e, "edgeType" : et, "edgeName": en, "isMultiLine" : m, "edgeWeight" :  ew, };
			
			/***** Region Begins - Adding the admittance and neighbours for the node. *****/
			var q, b, bi, admEnt;
			for(q = 0; q < n.busDO.dOL.length; q++) {
				b = n.busDO.dOL[q];
				if(b["admittance"] === undefined) {
					b["admittance"] = 0;
					b["neighbours"] = [];
					b["neighbourList"] = [];
				}
				//bi = parseInt(b.bus_i - 1);
				bi = parseInt(b.bus_i);
				if(bi === parseInt(e.fbus) && b.neighbourList.indexOf(e.tbus) === -1) {
					b.admittance += ew;
					admEnt = {};
					admEnt["id"] = e.tbus;
					admEnt["admittance"] = ew;
					b.neighbours.push(admEnt);
					b.neighbourList.push(e.tbus);
				}
				else if(bi === parseInt(e.tbus) && b.neighbourList.indexOf(e.fbus) === -1) {
					b.admittance += ew;
					admEnt = {};
					admEnt["id"] = e.fbus;
					admEnt["admittance"] = ew;
					b.neighbours.push(admEnt);
					b.neighbourList.push(e.fbus);
				}
			}
			/***** Region ends - Adding the admittance and neighbours for the node.. *****/
		}
		
		var ed = [];		
		Object.keys(edges).forEach(function(key, index) {  ed.push(this[key]);	}, edges);
		n.branchDO.dOL = ed;
	};
	
	/**
	*	Updates the string value by removing the unwanted characters.
	*	@param	strVal	The string value that needs to be updated.
	*	@return		The updated string value (i.e. removes the unwanted carriage character, semi-colon and additional spaces.
	**/
	NETWORK.ObjectFactory.prototype.beautifyValue = function(strVal) {
		var updatedStrVal = strVal.replace(';\r','');
		updatedStrVal = updatedStrVal.replace('\r','');
		updatedStrVal = updatedStrVal.trim();
		//This check has been added as some cases have comments after the last value - for example inputFiles/pub/nesta_case14_ieee.m (gen data case).
		if(updatedStrVal.indexOf(";") !== -1) {
			updatedStrVal = updatedStrVal.substr(0,updatedStrVal.indexOf(";"));
		}
		//updateStrVal = parseFloat(updateStrVal);
		return updatedStrVal;
	};	
	
	/***** Investigation Code - To update the NearestNeighbour Cluster buckets.*****/
	/**
	*	This needs to be checked???
	**/
	NETWORK.ObjectFactory.prototype.updateClusterBuckets = function(DOs) {
		var map = NETWORK.nodeEdgeMap,
			lst = DOs.branchDO.dOL,
			lstBus = DOs.busDO.dOL;
		
		for (i = 0 ; i < lst.length; i++) {
			var e = lst[i].edgeData;
			var s = lstBus[map[e.fbus]];
			var t = lstBus[map[e.tbus]];
			var sKv = parseFloat(s.baseKV), tKv = parseFloat(t.baseKV);
			if(NETWORK.distinctVoltages.indexOf(sKv) === -1)
				NETWORK.distinctVoltages.push(sKv);
				
			if(NETWORK.distinctVoltages.indexOf(tKv) === -1)
				NETWORK.distinctVoltages.push(tKv);
			
			if((parseFloat(s.baseKV)) > parseFloat(t.baseKV)) {
				var kv = t.baseKV;
				//Checking if there is already a bukcet for the baseKV value.
				if(typeof s.buckets === 'undefined'){
					s["buckets"] = {};
					//This stores the ID of all the nodes present in any/all of the bucket elements as a 
					//neighbour of this node.
					s["bucketNodes"] = [];
					s["totalBucketCount"] = 0;
				}
				if(typeof s.buckets[kv] === 'undefined'){
					s.buckets[kv] = [];
				}					
				s.buckets[kv].push(t);
				s.totalBucketCount = s.totalBucketCount + 1;
				s.bucketNodes.push(t.bus_i);
				lstBus[map[e.fbus]] = s;	
			}			
			else if ((parseFloat(s.baseKV)) === parseFloat(t.baseKV)) {
				var kv = t.baseKV;
				//Checking if there is already a bukcet for the baseKV value.
				if(typeof s.buckets === 'undefined'){
					s["buckets"] = {};
					//This stores the ID of all the nodes present in any/all of the bucket elements as a 
					//neighbour of this node.
					s["bucketNodes"] = [];
					s["totalBucketCount"] = 0;
				}
				if(typeof s.buckets[kv] === 'undefined'){
					s.buckets[kv] = [];
				}					
				s.buckets[kv].push(t);
				s.totalBucketCount = s.totalBucketCount + 1;
				s.bucketNodes.push(t.bus_i);
				lstBus[map[e.fbus]] = s;	
				
				var kv = s.baseKV;
				if(typeof t.buckets === 'undefined'){
					t["buckets"] = {};
					//This stores the ID of all the nodes present in any/all of the bucket elements as a 
					//neighbour of this node.
					t["bucketNodes"] = [];
					t["totalBucketCount"] = 0;
				}
					
				if(typeof t.buckets[kv] === 'undefined'){
					t.buckets[kv] = [];
				}
				t.buckets[kv].push(s);
				t.totalBucketCount = t.totalBucketCount + 1;
				t.bucketNodes.push(s.bus_i);
				lstBus[map[e.tbus]] = t;
			}
			else {
				var kv = s.baseKV;
				if(typeof t.buckets === 'undefined'){
					t["buckets"] = {};
					//This stores the ID of all the nodes present in any/all of the bucket elements as a 
					//neighbour of this node.
					t["bucketNodes"] = [];
					t["totalBucketCount"] = 0;
				}
					
				if(typeof t.buckets[kv] === 'undefined'){
					t.buckets[kv] = [];
				}
				t.buckets[kv].push(s);
				t.totalBucketCount = t.totalBucketCount + 1;
				t.bucketNodes.push(s.bus_i);
				lstBus[map[e.tbus]] = t;
			}
		}
	};	
	
	NETWORK.ObjectFactory.prototype.performNodeColorMapping = function() {
		for(var i = 0; i < NETWORK.distinctVoltages.length; i++) {
			NETWORK.baseKVColorMapping[NETWORK.distinctVoltages[i]] = NETWORK.RULES.colors[i];
			console.log(NETWORK.RULES.colors[i]);
		}
	};

	/**
	*	This method compresses the graph. The logic for compression is as follows:
	*	1. Sort the nodes in ascending order of admittance.
	*	2. Find the node with the lowest admittance.
	*	3. Collapse the node with to its lowest neighbour.
	**	4. This step is not implemented as yet - Check for the thershold and other constraints.
	*	5. Use the node compress information to make the link data structure.
	**/
	NETWORK.ObjectFactory.prototype.compressGraph = function(n,lvl) {
		//Sort the input based on the admittance.
		function sortLinksOnAdmittance(a,b) {
			return a.admittance - b.admittance;
		}
		
		var nodeList = this.compressNodes(NET_OBJ.busDO.dOL,1);
		//Compressing the nodes and getting the links of the compressed graph.
		var newLinks = [], newNodes = [], nl;
			
		for(var e = 0; e < nodeList.length; e++) {
			if(nodeList[e].remove === false) {
				newNodes.push(nodeList[e]);
			}
		}
		newNodes = newNodes.sort(sortLinksOnAdmittance);
		newLinks = [];
		nl = newNodes.length;
		//Finding the links between the nodes that remain from the filter.
		for(var i = nl-1; i >= 0; i--)  {
		var bus_i = newNodes[i].bus_i;
		var bFound = false;
			for(var k = nl-1; k > 0; k--) {
				if(newNodes[k].neighbourList.indexOf(bus_i) !== -1 && newNodes[k].bus_i !== bus_i) {
					var link = {};
					link["source"] = bus_i;
					link["target"] = newNodes[k].bus_i;
					newLinks.push(link);
					bFound = true;
				}
			}
			//checking for the presence of one or more neighbours of the node inside the neighbourlist of other nodes.
			if(!bFound) {
				var neighbourSearch = newNodes[i].neighbourList;		
				for(var j = nl-1; j >= 0; j--) {
					for(var l = 0; l < neighbourSearch.length; l++) {
						if(newNodes[j].neighbourList.indexOf(neighbourSearch[l]) !== -1 && newNodes[j].bus_i !== bus_i) {
							var link = {};
							link["source"] = bus_i;
							link["target"] = newNodes[j].bus_i;
							newLinks.push(link);
							bFound = true;
							break;
						}
					}
				}
			}
		}
		//Making the bus_i and nodeDataMap
		var updatedNodes = {};
		for(var x = 0; x < newNodes.length; x++) {
			updatedNodes[newNodes[x]["bus_i"]] = newNodes[x];
			
		}
		var crtLvl = {};
		crtLvl["level"] = lvl;
		crtLvl["nodes"] = updatedNodes;
		crtLvl["links"] = newLinks;
		COMPRESSED_NET.push(crtLvl);

	};
	
	
	NETWORK.ObjectFactory.prototype.compressNodes = function(list, repeatTimes) {
		var maxAdm = 0, minAdm = 0;
		var admitanceValues = [];
		
		//Sort the input based on the admittance.
		function sortLinksOnAdmittance(a,b) {
			admitanceValues.push(a.admittance);
			admitanceValues.push(b.admittance);
			
			return a.admittance - b.admittance;
		}
		function sortarray(a,b) {
			return a - b;
		}
		function getMax(x) {
			var y = x.length;
			if(x.length >= 4) {
				if((x[y-1] * .9) > x[y-2]) {
					return x[y-2];
				}
				else if((x[y-1] * .9) > x[y-3]) {
					return x[y-3];
				}
				else if((x[y-1] * .9) > x[y-4]) {
					return x[y-4];
				}
				else {
					return x[y-1];
				}
			}
			
		}
		
		for(var x = 0; x < repeatTimes; x++) {
			//Sorting the list in ascending order based on admittance.
			var nodeList = list.sort(sortLinksOnAdmittance);			
			var max = getMax($.distinct(admitanceValues).sort(sortarray));
			
			//Creating the Map for the sorted and unsorted positions and sorting the neighbours of each node.
			var sortedMap = {};
			for(e = 0; e < nodeList.length; e++) {
				//Creating the sorted map.
				sortedMap[nodeList[e]["bus_i"]] = e;
				   
				//Sorting the neighbours based on admittance.
				nodeList[e].neighbours.sort(sortLinksOnAdmittance);
				
				/***** Region Begin - Investigation Code for removing the same node from being added twice *****/
				//This logic should be covered in the other for loops...but it is being checked here as a part of Investigative Code.
				var a = nodeList[e].neighbours.length;
				while(a--) {
					if(nodeList[e].bus_i === nodeList[e].neighbours[a].id) {
						nodeList[e].neighbours.splice(a, 1);
					}
				}
				/***** Region Ends -  Investigation Code for removing the same node from being added twice *****/
			}
			
			for(var i = 0; i < nodeList.length; i++) {
				var nodeIDCheck = parseInt(nodeList[i].bus_i);
				//if(nodeIDCheck === 1410 || nodeIDCheck === 1409 || nodeIDCheck === 1608 || nodeIDCheck === 1609) {
				if(nodeIDCheck === 1609) {
					console.log(i);
				}
				
				if((nodeList[i].remove === undefined || nodeList[i].remove === false) && nodeList[i].neighbours.length > 0) {
					if(nodeList[i].admittance <= nodeList[sortedMap[nodeList[i].neighbours[0].id]].admittance) {
						//Removing the item from the nodeList and adding its neighbours to the node in which it has been compressed.
						nodeList[sortedMap[nodeList[i].neighbours[0].id]].admittance = 
							nodeList[sortedMap[nodeList[i].neighbours[0].id]].admittance + nodeList[i].admittance - nodeList[i].neighbours[0].admittance;
					
						//Adding the node index to the neighbourList if it is already not present in the list.
						if(nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbourList.indexOf(nodeList[i].bus_i) === -1) {
							nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbourList.push(nodeList[i].bus_i);
						}
						
						//Adding all the neighbours of the first neighbour to the node.
						var nN = nodeList[i].neighbourList;
						for(var j = 0; j < nN.length; j++) {
							//Adding all the neighbours of the first neighbour to the node if they are already not present in the list.
							if(nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbourList.indexOf(nN[j]) === -1) {
								nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbourList.push(nN[j]);
							}
						}
						
						//Removing the current node from the Neighbour array of the node as this will always have value lower than that of the node...
						//the above explanantion is ambiguous... :P
						var n = nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbours;
						for(var k = 0; k < n.length; k++) {
							if(n[k].id === nodeList[i].bus_i) {
								n.splice(k, 1);
							}
						}
						if(n.length > 0) {
							nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbours = n;
							
							//Removing the common neighbours and the first neighbour from the node...The filtered neighbours will be added to the neighbour list of the first neighbour of the node.
							var m = nodeList[i].neighbours;
							var firstNeighbourID = m[0].id;
							var z = nodeList[sortedMap[firstNeighbourID]].neighbours;
							var l = m.length - 1;
							while(l >= 0) {
								var decL = true;
								for(var k = 0; k < z.length; k++) {
									if(z[k].id.toString() === "1608") {
										console.log("123");
									}
									if(m.length > 0) {							
										if(m[l].id === z[k].id) {
											m.splice(l, 1);
											if(l > 0) {
												l = l - 1;
											}
											decL = false;
										}
									}
									if(m.length > 0) {							
										if(m[l].id === nodeList[sortedMap[firstNeighbourID]].bus_i) {
											m.splice(l, 1);
											if(l > 0) {
												l = l - 1;
											}
											decL = false;
										}
									}
								}
								if(decL) {
									l = l - 1;
								}
							}

							//This is highly inefficient coding...but I just want it to work for the presentation.
							//Check for - All the neighbours between the nodes might be common and already removed.
							/*if(m.length > 0) {							
								var r = m.length - 1;
								while(r--) {
									//Removing the node itself from the neighbours.
									if(m[r].id === nodeList[sortedMap[m[0].id]].bus_i) {
										m.splice(r, 1);
									}
								}
							}*/
						
							nodeList[i].neighbours = m;
						
							if(nodeList[i].neighbours.length > 0) {
								nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbours.push.apply(nodeList[sortedMap[nodeList[i].neighbours[0].id]].neighbours, nodeList[i].neighbours);
							}
							else {
								//do nothing as the node had only one neighbour which has been removed.
							}
						}
						nodeList[i].remove = true;
					}
					else {
						nodeList[i].remove = false;
					}
				}
			}
		}
		return nodeList;
	};

	//Adding distinct function for jQuery Array
	$.extend({
		distinct : function(array) {
		   var r = [];
		   $.each(array, function(i,v){
			   if ($.inArray(v, r) == -1) {
				   r.push(v);
			   }
		   });
		   return r;
		}
	});

		
})(NETWORK || (NETWORK = {}));