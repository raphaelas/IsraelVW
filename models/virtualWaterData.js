var util = require('util');
//var mongoClient = require("mongodb").MongoClient;
//var server = "mongodb://localhost:27017/";

var mongodb = require('mongodb');
var db = new mongodb.Db('nodejitsudb123536169',
                        new mongodb.Server('troup.mongohq.com', 10091, {}), {safe:true}
);

db.open(function(err, db_p) {
    if (err) {
        throw err;
    }
    db.authenticate('nodejitsu', '87d68fa2a3f25410f3d7a22c2d3881e2', function (err, replies) {
    	// You are now connected and authenticated.
    });
});

var doError = function (e) {
    util.debug(e);
    throw new Error(e);
}

var arrayToSend = [];
var completeArrayLength = 6;
var currentCommodity = "Rice (Milled Equivalent)";
var currentYear = "2012";
var currentColor = "Green";

exports.getCurrentCommodity = function() {
	return currentCommodity;
}

exports.setCommodity = function(comToSet) {
	currentCommodity = comToSet;
}

exports.getCurrentYear = function() {
	return currentYear;
}

exports.setYear = function(yearToSet) {
	currentYear = yearToSet;
}

exports.getCurrentColor = function() {
	return currentColor;
}

exports.setColor = function(colorToSet) {
	currentColor = colorToSet;
}

exports.getVirtualWaterData = function(req, callback) {
	arrayToSend = [];
	completeArrayLength = 6;
	var com = currentCommodity = req.commodity;
	var currYear = currentYear = req.year;
	var currColor = currentColor = req.color;
	if (com === "All") {
		aggregateDataAndCalculate({
			commodity: com,
			year: currYear,
			color: currColor.toLowerCase()
		})
	}
	else {
		getDataAndCalculate({
			commodity: com,
			year: currYear,
			color: currColor.toLowerCase()
		});
	}

	var _flagCheck = setInterval(function() {
	    if (arrayToSend.length == completeArrayLength) {
	        clearInterval(_flagCheck);
			arrayToSend = arrayToSend.sort(function(a,b){
				return b[3]-a[3];
			});
	        callback(arrayToSend); // the function to run once all flags are true
	    }
	}, 100); // interval set at 100 milliseconds
}

function getDataAndCalculate(toFind) {
  	var callback = function(model) {
  		completeArrayLength = model.length;
		for (var i = 0; i < model.length; i++) {
			var curr = model[i];
			var data;
			if (curr.country === "Israel") {
				if (toFind.color !== "all") {
					//data+toFind.year could be i.e. data2010
					data = convertToMCM(curr["export"+toFind.year] * curr[toFind.color], 3);
//					var multiplied = addCommaSeparator(data.toString());
//					console.log("" + curr.country + ": " + addCommaSeparator(curr["export"+toFind.year].toString()) + " tons * " + addCommaSeparator(curr[toFind.color].toString()) + " m^3/tons = " + multiplied);
					arrayToSend.push([curr.country, curr["export"+toFind.year], convertToMCM(curr[toFind.color], 6), data]);
				}
				else { //toFind.color is all
					data = convertToMCM(curr["export"+toFind.year] * (curr['green'] + curr['blue'] + curr['grey']), 3);
					arrayToSend.push([curr.country, curr["export"+toFind.year], convertToMCM(curr['green'] + curr['blue'] + curr['grey'], 6), data]);
				}
				console.log(arrayToSend);
			} //if country is Israel
			else if (curr.country !== "British Virgin Islands" &&
			 curr.country !== "Singapore" && curr.country !== "CC4te d\'Ivoire"
			 && curr.country !== "Hong Kong, China") {
				if (toFind.color !== "all") {
					//data+toFind.year could be i.e. data2010
					data = convertToMCM(curr["data"+toFind.year] * curr[toFind.color], 3);
//					var multiplied = addCommaSeparator(data.toString());
//					console.log("" + curr.country + ": " + addCommaSeparator(curr["data"+toFind.year].toString()) + " tons * " + addCommaSeparator(curr[toFind.color].toString()) + " m^3/tons = " + multiplied);
					if (data >= 0.001) {
						arrayToSend.push([curr.country, curr["data"+toFind.year], convertToMCM(curr[toFind.color], 6), data]);
					}
					else {
						completeArrayLength--;
					}
				}
				else { //toFind.color is all
					data = convertToMCM(curr["data"+toFind.year] * (curr['green'] + curr['blue'] + curr['grey']), 3);
					console.log(data);
					if (data >= 0.001) {
						arrayToSend.push([curr.country, curr["data"+toFind.year], convertToMCM(curr['green'] + curr['blue'] + curr['grey'], 6), data])
					}
					else {
						completeArrayLength--;
					}
				}
				console.log(arrayToSend);
			} //else if curr.country !== British Virgin..
			else { //curr.country is something not in the db.
				completeArrayLength--;
				console.log("XML does not contain " + curr.country + " - " + curr["data"+toFind.year] + " tons.");
			}
		} //for
	}; //callback
// For terminal startup use:
//	db.collection("tradeMap").aggregate({$project: {mult: {$multiply: ['$data' + toFind.year, '$' + toFind.color]}}}, {$match: {mult: {$gte: 500}}});
	var dbCall = {
		commodity: toFind.commodity
	};
	var colorObject = {};
	if (toFind.color !== "all") {
		colorObject["" + toFind.color] = {$gt: 0};
	}
	else {
	}
//  	mongoClient.connect(server+"virtualwaterDB", function(err, db) {
//		if (err) doError(err);
		var currYear = toFind.year;
		if (currYear === '2009') {
			dbCall.$or = [{$and : [{data2009: {$gt: 0}}, colorObject]}, {country: "Israel"}]
			var crsr = db.collection("tradeMap").find(dbCall).sort({export2009: -1, data2009: -1}).limit(6);
		} //if
		else if (currYear === '2010') {
			dbCall.$or = [{$and : [{data2010: {$gt: 0}}, colorObject]}, {country: "Israel"}]
			var crsr = db.collection("tradeMap").find(dbCall).sort({export2010: -1, data2010: -1}).limit(6);
		} //else if
		else if (currYear === '2011') {
			dbCall.$or = [{$and : [{data2011: {$gt: 0}}, colorObject]}, {country: "Israel"}]
			var crsr = db.collection("tradeMap").find(dbCall).sort({export2011: -1, data2011: -1}).limit(6);
		} //else if
		else if (currYear === '2012') {
			dbCall.$or = [{$and : [{data2012: {$gt: 0}}, colorObject]}, {country: "Israel"}]
			var crsr = db.collection("tradeMap").find(dbCall).sort({export2012: -1, data2012: -1}).limit(6);
		} //else if
		else {
			doError("Query tradeMap failed.");
		} //else
		crsr.toArray(function(err, docs) {
		    if (err) doError(err);
		    callback(docs);
		});
//    }); //mongoClient
}

function aggregateDataAndCalculate(toFind) {
//  	mongoClient.connect(server+"virtualwaterDB", function(err, db) {
//		if (err) doError(err);
		if (toFind.color !== "all") {
			var projectObject = {};
			projectObject["country"] = 1;
			projectObject["data"+toFind.year] = 1;
			projectObject["" + toFind.color] = 1;
			projectObject["mult"] = {
				$multiply: ["$"+toFind.color, "$data"+toFind.year]
			}
			db.collection("tradeMap").aggregate({
				$project: projectObject
			}, {
				$group: {
					_id: "$country", total: {
						$sum : "$mult"
					}, tons: {
						$sum: "$data"+toFind.year
					}, average: {
						$avg: "$"+toFind.color
					}
				}
			}, {
				$match: {
					total: {$gt: 0}
				}
			}, {
				$sort: {
					total: -1
				}
			}, {
				$limit: 5
			}, function(err, result){
				if (err) doError(err);
				for (var i = 0; i < result.length; i++) {
					arrayToSend.push([result[i]._id, result[i].tons, convertToMCM(result[i].average, 6), convertToMCM(result[i].total, 3)]);
				}
			}
		);
		} //if toFind.color !== all
		else {
			var projectObject1a = {};
			projectObject1a["country"] = 1;
			projectObject1a["data"+toFind.year] = 1;
			projectObject1a["theSum"] = {
				$add: ["$green", "$blue", "$grey"]
			}
			var projectObject1b = {};
			projectObject1b["country"] = 1;
			projectObject1b["data"+toFind.year] = 1;
			projectObject1b["mult"] = {
				$multiply: ["$theSum", "$data"+toFind.year]
			}
			db.collection("tradeMap").aggregate({
				$project: projectObject1a
			}, {
				$project: projectObject1b
			}, {
				$group: {
					_id: "$country", total: {
						$sum : "$mult"
					}, tons: {
						$sum: "$data"+toFind.year
					}, average: {
						$avg: "$mult"
					}
				}
			}, {
				$match: {
					total: {$gt: 0}
				}
			}, { 
				$sort: { 
					total: -1 
				} 
			}, { 
				$limit: 5 
			}, function(err, result){
				if (err) doError(err);
				for (var i = 0; i < result.length; i++) {
					arrayToSend.push([result[i]._id, result[i].tons, convertToMCM(result[i].average, 6), convertToMCM(result[i].total, 3)]);
				}
			}
			);
		} //else
		getIsraelToo(toFind);
//  	}); //mongoClient.connect
}


function getIsraelToo(toFind){
//  	mongoClient.connect(server+"virtualwaterDB", function(err, db) {
//		if (err) doError(err);
		if (toFind.color !== "all") {
			var projectObject2 = {};
			projectObject2["country"] = 1;
			projectObject2["export"+toFind.year] = 1;
			projectObject2["" + toFind.color] = 1;
			projectObject2["mult"] = {
					$multiply: ["$"+toFind.color, "$export"+toFind.year]
			}
			db.collection("tradeMap").aggregate({
				$project: projectObject2
			}, {
				$group: {
					_id: "$country", total: {
						$sum : "$mult"
					}, tons: {
						$sum: "$export"+toFind.year
					}, average: {
						$avg: "$"+toFind.color
					}
				}
			}, { 
				$match : { 
					_id : "Israel" 
				} 
			}, function(err, result){
				if (err) doError(err);
				for (var i = 0; i < result.length; i++) {
					arrayToSend.push([result[i]._id, result[i].tons, convertToMCM(result[i].average, 6), convertToMCM(result[i].total, 3)]);
				}
				console.log(arrayToSend);
			});
		}
		else {
			var projectObject2a = {};
			projectObject2a["country"] = 1;
			projectObject2a["export"+toFind.year] = 1;
			projectObject2a["theSum"] = {
				$add: ["$green", "$blue", "$grey"]
			}
			var projectObject2b = {};
			projectObject2b["country"] = 1;
			projectObject2b["export"+toFind.year] = 1;
			projectObject2b["mult"] = {
				$multiply: ["$theSum", "$export"+toFind.year]
			}
			db.collection("tradeMap").aggregate({
				$project: projectObject2a
			}, {
				$project: projectObject2b
			}, {
				$group: {
					_id: "$country", total: {
						$sum : "$mult"
					}, tons: {
						$sum: "$export" + toFind.year
					}, average: {
						$avg: "$mult"
					}
				}
			}, {
				$match : {
					_id : "Israel"
				} 
			}, function(err, result) {
				if (err) doError(err);
				for (var i = 0; i < result.length; i++) {
					arrayToSend.push([result[i]._id, result[i].tons, convertToMCM(result[i].average, 6), convertToMCM(result[i].total, 3)]);
					console.log(arrayToSend);
				}
			}
		);
		} //else
//  	}); //mongoClient.connect
}

//Converts a cubic meter value into a millions cubic meter value.
function convertToMCM(toConvert, decimalPoints) {
	var MILLIONSCMCONVERSION = 1000000;
	return parseFloat((toConvert/MILLIONSCMCONVERSION).toFixed(decimalPoints));
}

function addCommaSeparator(strNumber) {
    var parts = strNumber.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}