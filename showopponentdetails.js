var args = arguments[0] || {};

function onCreate() {
	console.log("made it to showOpponentDetails");
	console.log("Opponent Details: " + JSON.stringify(args.payload));
	var totalDeaths = 0;
	var totalKills = 0;
	var totalAssists = 0;
	var winLossArray = [];
	var numGames = args.payload.length;
	for (var x = 0; x < args.payload.length; x++) {
		totalDeaths += args.payload[x].deaths;
		totalKills += args.payload[x].kills;
		totalAssists += args.payload[x].assists;
		winLossArray.push(args.payload[x].winner);
	}
	var avgDeaths = Math.round(totalDeaths / numGames);
	var avgAssists = Math.round(totalAssists / numGames);
	var avgKills = Math.round(totalKills / numGames);

	console.log("avgDeaths last 5 games: " + avgDeaths);
	console.log("avgAssists last 5 games: " + avgAssists);
	console.log("avgKills last 5 games: " + avgKills);

	if (losingStreakp(winLossArray)) {
		console.log("This player is on a losing streak!");
		var myview = Ti.UI.createLabel({
			text : "Average Kills: " + avgKills + "\n" + "Average Deaths: " + avgDeaths + "\n" + "Average Assists: " + avgAssists + "\n" + "This player is on a losing streak!"
		});
	} else {
		var myview = Ti.UI.createLabel({
			text : "Average Kills: " + avgKills + "\n" + "Average Deaths: " + avgDeaths + "\n" + "Average Assists: " + avgAssists
		});
	}

	$.iShoOppDets.add(myview);

}

// Check to see if given array has 3 false bools in the first 3 entries
// ListofBoolean -> Boolean
function losingStreakp(myList) {
	var numLoss = 0;
	var returnBool = false;
	for (var x = 0; x < 3; x++) {
		if (myList[x] == false) {
			numLoss++;
		}
	}
	if (numLoss > 2) {
		returnBool = true;
	}
	return returnBool;
}
