// ********** GLOBAL VARIABLES ***********
var acc = 0;
//var getStatsTeamLengthAcc = 0;
var payloadArray = [];
//var pushedStatsFlag = false;
//var pushedUserRankFlag = false;
Alloy.Globals.theNavWindow = $.iNavWindow;

//open window in index.xml
if (OS_IOS) {
	Alloy.Globals.theNavWindow.open();
} else {
	$.iIndexWin.open();
}
////////FUNCTIONS//////////////
//initialization function, called from onOpen in xml
function onCreate() {
	Ti.API.info("onCreate() called");
}

function onGoButton() {
	// reset global variables:
	acc = 0;
	payloadArray = [];
	console.log("onGoButton called");

	var selectedRowTitle = $.picker.getSelectedRow(0).title;
	var servername = selectedRowTitle.toLowerCase();
	var platformID = $.picker.getSelectedRow(0).id;
	var username = $.iUsernameTextField.value;

	//  Replace spaces with %20 for XHR
	var replaceThisValue = / /gi;
	username = username.replace(replaceThisValue, "%20");

	console.log("Username: " + username);

	//short version how to send xhr GET
	var xhr = Ti.Network.createHTTPClient({
		onload : function(e) {
			// function called in readyState DONE (4)
			// Ti.API.info('onload called, readyState = ' + this.readyState);
			//Ti.API.info('responsetext is: ' + this.responseText);
			var aId = this.responseText.split('":');
			console.log(aId[2]);
			var aId2 = aId[2].split(",");
			console.log(aId2[0]);
			var summonerID = aId2[0];
			// we have the id as a string right now ^

			/*get current match / return error if no current match*/
			getCurrentMatch(summonerID, platformID, servername);
			/*
			 for each participant opponent in current match:
			 user id -> match history

			 pick latest match history -> get rank (highestAchievedSeasonTier)
			 check for if matches is empty array*/
		},
		onerror : function(e) {
			// function called in readyState DONE (4)
			console.log(e.error);
			if (e.error === "HTTP error") {
				alert("Sorry, the username was not found.");
			} else {
				alert("The network connection has timed out. Please try again.");
			}

			Ti.API.info('onerror called, readyState = ' + this.readyState);
		},
		timeout : 20000 // in milliseconds
	});

	var finishedString = "https://" + servername + ".api.pvp.net/api/lol/" + servername + "/v1.4/summoner/by-name/" + username + "?api_key=" + Alloy.Globals.lolAPIKey;
	// console.log("XHR for summoner ID: " + finishedString);

	xhr.open("GET", finishedString);
	xhr.send();
}

function getCurrentMatch(summonerID, platformID, servername) {
	var xhr = Ti.Network.createHTTPClient({
		onload : function(e) {
			// function called in readyState DONE (4)
			// Ti.API.info('onload called, readyState = ' + this.readyState);
			//Ti.API.info('responsetext is: ' + this.responseText);

			// populate a list of opponent summonerIds
			var mObject = JSON.parse(this.responseText);

			var opponentIdArray = getOpponentIds(mObject.participants, summonerID);

			Ti.API.info('opponentIdArray: ' + JSON.stringify(opponentIdArray));

			/*
			 for each participant opponent in current match:
			 user id -> match history*/
			var aOpponentUid = parseOpponents(opponentIdArray);
			console.log(JSON.stringify(aOpponentUid));

			for (var i = 0; i < aOpponentUid.length; i++) {
				getRank(aOpponentUid[i], servername, aOpponentUid.length);
			}

			/*
			 pick latest match history -> get rank (highestAchievedSeasonTier)
			 check for if matches is empty array*/
		},
		onerror : function(e) {
			// function called in readyState DONE (4)
			// console.log("THE ERROR IS: " + e.error);
			if (e.error === "HTTP error") {
				alert("Please make sure the summoner you entered is in a game.");
			} else if (OS_ANDROID && e.error === "Not Found") {
				alert("Please make sure the summoner you entered is in a game.");
			} else {
				alert("The network connection has timed out. Please try again.");
			}

			Ti.API.info('onerror called, readyState = ' + this.readyState);
		},
		timeout : 20000 // in milliseconds
	});

	var finishedString = "https://" + servername + ".api.pvp.net/observer-mode/rest/consumer/getSpectatorGameInfo/" + platformID + "/" + summonerID + "?api_key=" + Alloy.Globals.lolAPIKey;

	xhr.open("GET", finishedString);
	xhr.send();
}

function getRank(myUid, servername, teamSize) {
	var xhr = Ti.Network.createHTTPClient({
		onload : function(e) {

			// function called in readyState DONE (4)
			// Ti.API.info('onload called, readyState = ' + this.readyState);
			//Ti.API.info('responsetext is: ' + this.responseText);

			var rank;
			if (this.responseText === "{}") {
				//user has never played a ranked game
				rank = "UNRANKED";
			} else {
				// populate a list of opponent summonerIds
				var mObject = JSON.parse(this.responseText);

				/*
				 pick latest match history -> get rank (highestAchievedSeasonTier)
				 check for if matches is empty array*/

				var aMatches = mObject.matches;
				var oLastMatch = aMatches[aMatches.length - 1];
				var aParticipants = oLastMatch.participants;
				rank = aParticipants[0].highestAchievedSeasonTier;

				var aParticipantIds = oLastMatch.participantIdentities;
				var musername = aParticipantIds[0].player.summonerName;

			}

			console.log("The Username is: " + musername + " and the Rank is: " + rank);

			// send username and rank as payload.
			// if acc == teamSize send username and rank array to showResults
			// TODO: add Kills/Deaths/Assists and Last 5 games win/loss to "toShowResults"

			getStats(servername, myUid, musername, rank, teamSize);

			//toShowResults(musername, rank, statsArray, teamSize);
		},
		onerror : function(e) {
			// function called in readyState DONE (4)
			console.log(e.error);
			if (e.error === "HTTP error") {
				alert("Sorry, summoner with UID " + myUid + " does not exist");
			} else {
				alert("The network connection has timed out. Please try again.");
			}

			Ti.API.info('onerror called, readyState = ' + this.readyState);
		},
		timeout : 20000 // in milliseconds
	});

	var finishedString = "https://" + servername + ".api.pvp.net/api/lol/" + servername + "/v2.2/matchhistory/" + myUid + "?api_key=" + Alloy.Globals.lolAPIKey;
	xhr.open("GET", finishedString);
	xhr.send();
}

function getOpponentIds(marray, myID) {
	var halflen = marray.length / 2;

	var isFirstHalf = false;
	//first, find whether myId is in first half or last half
	for (var i = 0; i < halflen; i++) {
		if (marray[i].summonerId == myID) {
			//our user is in first half. go for second half
			isFirstHalf = true;
			break;
		}
	}

	var returnArray = [];
	var mystart = 0;
	if (isFirstHalf) {
		//then we go for second half
		mystart = halflen;
	}

	for (var i = mystart; i < (mystart + halflen); i++) {
		returnArray.push(marray[i]);
	}

	return returnArray;
}

function parseOpponents(opponentIdArray) {
	var mresult = [];
	for (var i = 0; i < opponentIdArray.length; i++) {
		mresult.push(opponentIdArray[i].summonerId);
	}
	return mresult;
}

// Open the next view which returns to the user the opponents and ranks
function showResults(payloadArray) {
	//in createactivity.js, you can get payload via args.payload (assuming you keep the default var args in that js)
	var showResults = Alloy.createController('showresults', {
		payload : payloadArray
	}).getView();
	//opens the new activity
	if (OS_IOS) {
		//opens the next activity inside the nav window
		$.iNavWindow.openWindow(showResults);
		//set a global reference so you can call it outside index
		//Alloy.Globals.myNavWindow = $.iNavWindow;
	} else {
		showResults.open();
	}
}

function toShowResults(username, rank, statsArray, teamSize) {
	console.log("made it to toShowResults");

	payloadArray.push({
		username : username,
		rank : rank,
		stats : statsArray
	});

	console.log("toShowResults payloadArray: " + JSON.stringify(payloadArray));

	if (acc == teamSize - 1) {
		console.log("payloadArray in toShowResults: " + JSON.stringify(payloadArray));
		acc = 0;
		showResults(payloadArray);
		payloadArray = [];
	} else {
		acc = acc + 1;
	}
}

// Takes servername/region (i.e. na) and summonerID and
// calls sendStats with an object populated with player stats
// from last 5 games
function getStats(region, summonerID, musername, rank, teamSize) {
	//short version how to send xhr GET
	var xhr = Ti.Network.createHTTPClient({
		onload : function(e) {
			// function called in readyState DONE (4)
			// Ti.API.info('onload called, readyState = ' + this.readyState);
			//Ti.API.info('responsetext is: ' + this.responseText);
			var mObject = JSON.parse(this.responseText);
			var aMatches = mObject.matches;
			var oStats = [];
			/*
			console.log("aMatches: " + JSON.stringify(aMatches[0]));
			console.log("aMatches participants: " + JSON.stringify(aMatches[0].participants));
			console.log("aMatches Participants[0] stats: " + aMatches[0].participants[0].stats.winner);
			*/
			//console.log("Match length: " + aMatches.length);
			for (var index = 0; index < aMatches.length; index++) {
				// For each match, grab the stats object
				oStats.push({
					winner : aMatches[index].participants[0].stats.winner,
					kills : aMatches[index].participants[0].stats.kills,
					deaths : aMatches[index].participants[0].stats.deaths,
					assists : aMatches[index].participants[0].stats.assists
				});
			}
			// push onto payload array, set pushflag
			Ti.API.info("getStats oStats: " + JSON.stringify(oStats));

			toShowResults(musername, rank, oStats, teamSize);

			/*
			getStatsTeamLengthAcc += 1;
			if (getStatsTeamLengthAcc == teamLength) {
			pushedStatsFlag = true;
			}
			*/
			//console.log("**** pushed stats to payload array "+getStatsTeamLengthAcc+" times ****");
			//console.log("payloadArray: " + JSON.stringify(payloadArray));
		},
		onerror : function(e) {
			// function called in readyState DONE (4)
			//getStatsTeamLengthAcc = 0;

			console.log(e.error);

			Ti.API.info('onerror called, readyState = ' + this.readyState);
			console.log(this.responseText);

			if (this.responseText === '{"status": {"message": "Rate limit exceeded", "status_code": 429}}') {
				alert("Please wait, fetching additional player data...");
				setTimeout(function(e) {
					var xhr = Ti.Network.createHTTPClient({
						onload : function(e) {
							var mObject = JSON.parse(this.responseText);
							var aMatches = mObject.matches;
							var oStats = [];
							for (var index = 0; index < aMatches.length; index++) {
								// For each match, grab the stats object
								oStats.push({
									winner : aMatches[index].participants[0].stats.winner,
									kills : aMatches[index].participants[0].stats.kills,
									deaths : aMatches[index].participants[0].stats.deaths,
									assists : aMatches[index].participants[0].stats.assists
								});
							}
							// push onto payload array, set pushflag
							Ti.API.info("getStats oStats: " + JSON.stringify(oStats));

							toShowResults(musername, rank, oStats, teamSize);
						},
						onerror : function(e) {
							console.log(e.error);
							if (e.error === "HTTP error") {
								alert("Problem getting summoner statistics.");
							} else {
								alert("The network connection has timed out. Please try again.");
							}

							Ti.API.info('onerror called, readyState = ' + this.readyState);
						}
					});

					var finishedString = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v2.2/matchhistory/" + summonerID + "?beginIndex=0&endIndex=5&api_key=" + Alloy.Globals.lolAPIKey;

					console.log("XHR for getStats: " + finishedString);

					xhr.open("GET", finishedString);
					xhr.send();
				}, 10000 // Wait 10 seconds until resending
				);
			} else if (e.error === "HTTP error" && this.responseText != '{"status": {"message": "Rate limit exceeded", "status_code": 429}}') {
				alert("Problem getting summoner statistics.");
			} else {
				alert("The network connection has timed out. Please try again.");
			}
		},
		timeout : 20000 // in milliseconds
	});

	var finishedString = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v2.2/matchhistory/" + summonerID + "?beginIndex=0&endIndex=5&api_key=" + Alloy.Globals.lolAPIKey;

	console.log("XHR for getStats: " + finishedString);

	xhr.open("GET", finishedString);
	xhr.send();
}

/*
 //when user clicks create button
 function onCreateButton() {
 //in createactivity.js, you can get payload via args.payload (assuming you keep the default var args in that js)
 var createActivity = Alloy.createController('createactivity', {
 payload : "my_payload"
 }).getView();
 //opens the new activity
 if (OS_IOS) {
 //opens the next activity inside the nav window
 $.iNavWindow.openWindow(createActivity);
 //set a global reference so you can call it outside index
 //Alloy.Globals.myNavWindow = $.iNavWindow;
 } else {
 createActivity.open();
 }
 }

 //press shift+cmd+c while highlighting project explorer, then type in createactivity.
 //in createactivity.xml, delete everything and paste this:
 <Alloy>
 <Window class="container" id="iCreateWindow" onOpen="onCreate">
 </Window>
 </Alloy>
 */
