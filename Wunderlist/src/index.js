/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 
 TODO
 - Introduce call backs or async library to avoid large functions and break the methods down. 
	- Currently node js executes diff functions in diff threads.
 - Allow user to specify alternate list name  
 - Get list id from api, Remove hardcoded list ids
 - Add function to create a new list if it doesnt exist 
 - make appId a variable to make it more secure
 */

'use strict';

var request = require('request');
var async = require('async');

var apiAccessToken = "";
var apiClientId = "";

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
		
    try {					
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
		
		if (process.env.xAccessToken == undefined) {
			apiAccessToken = event.session.attributes.xAccessToken;
		} else {
			apiAccessToken = process.env.xAccessToken;
		}
		
		if (process.env.xClientId == undefined) {
			apiClientId = event.session.attributes.xClientId
		} else {
			apiClientId = process.env.xClientId;
		}

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

		if (event.session.application.applicationId !== "amzn1.ask.skill.8ce4061e-150b-4b92-b1dd-202c85dcf24d") {
			context.fail("Invalid Application ID");
		 }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") { 
			 onIntent(event.request,
                event.session,
				context);
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);		
	getHelpResponse(session, callback);
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // Add any cleanup logic here
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, context) {

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
		
	if ("ItemIntent" === intentName) {
        handleAddItemRequest(intent, session, context);
    } else if ("ListIntent" === intentName) {
        handleListItemRequest(intent, session, context);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleNoIntentRequest(intent, session, context);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, context);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, context);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, context);
    } else {
        throw "Invalid intent";
    }
}

function handleNoIntentRequest(intent, session, context) {	
	getHelpResponse(session, context);	
}

function handleGetHelpRequest(intent, session, context) {	
	getHelpResponse(session, context);	
}

function getHelpResponse(session, context) {
	var speechOutput = "You can tell wunderlist to add an item to a list! e.g. Add eggs to groceries!";
	var speechResponse = buildSpeechletResponseWithoutCard(speechOutput, "", true);
	
	context.succeed(buildResponse(session.attributes, speechResponse));
}

function handleFinishSessionRequest(intent, session, context) {
	
	var speechOutput = "See you later!";
	var speechResponse = buildSpeechletResponseWithoutCard(speechOutput, "", true);
	
	context.succeed(buildResponse(session.attributes, speechResponse));
}

function handleAddItemRequest(intent, session, context) {
	
	try {
		
		var listDetails = GetListDetails(intent);		
				
		async.waterfall([
			async.apply(AddItemToList, listDetails),
			ProcessAddItemResponse
		], function (err, speechResponse) {			
			context.succeed(buildResponse(session.attributes, speechResponse));			
		});					
	
	} catch (e) {
        context.fail("Exception: " + e);
    }		
}

function handleListItemRequest(intent, session, context) {
	
	try {				
		var listDetails = GetListDetails(intent);							
									
		async.waterfall([
			async.apply(GetListItems, listDetails),
			ProcessListResponse
		], function (err, speechResponse) {			
			context.succeed(buildResponse(session.attributes, speechResponse));			
		});	
		
	} catch (e) {
        context.fail("Exception: " + e);
    }		
}



function AddItemToList(listDetails, callback) {
				
	request.post(
		'https://a.wunderlist.com/api/v1/tasks',
		{ 
			json: BuildAddItemJson(listDetails.listId, listDetails.item), 
			headers: BuildRequestHeaders()
		},
		function (error, response, body) {
			callback(null, error, response, body, listDetails);
		});
}

function ProcessAddItemResponse(error, response, body, listDetails, callback) {
		
	var speechResponse = null;
	
	if (!error && response.statusCode == 201) {		
		speechResponse = GetAddItemSpeechResponse(body, listDetails);																	
	} else {						
		speechResponse = GetAddItemErrorSpeechResponse(listDetails);
	}
	
	callback(null, speechResponse);
}


function GetListItems(listDetails, callback) {	
						
	request.get(
		'https://a.wunderlist.com/api/v1/tasks?list_id=' + listDetails.listId,
		{ 
			headers: BuildRequestHeaders()
		},
		function (error, response, body) {
			callback(null, error, response, body, listDetails);
		});					
}

function ProcessListResponse(error, response, body, listDetails, callback) {
								
	var speechResponse = null;
				
	if (!error && response.statusCode == 200) {								
		speechResponse = GetListOfItemsSpeechResponse(body, listDetails.listTitle);																	
	} else {						
		speechResponse = GetListOfItemsErrorSpeechResponse(listDetails.listTitle);				
	}
		
	callback(null, speechResponse);
}

function GetAddItemSpeechResponse(body, listDetails) {
	
	var speechResponse = null;
	var newItemId = body.id;

	if (newItemId !== null && newItemId !== undefined && newItemId > 0) {
		speechResponse = GetAddItemSuccessSpeechResponse(listDetails);
	} else {
		speechResponse = GetAddItemErrorSpeechResponse(listDetails);
	}
	
	return speechResponse;
	
}

function GetAddItemSuccessSpeechResponse(listDetails) {	
	var plural = GetPlural(listDetails.item);		
	var cardTitle = listDetails.item + plural + " been added to " + listDetails.listTitle + ".";
	var speechOutput = listDetails.item + plural + " been added to " + listDetails.listTitle + "!";
	return buildSpeechletResponse(cardTitle, speechOutput, "", true)
}

function GetPlural(item) {
	var lastChar = item.replace(/\s/g, '').slice(-1);
	var plural = " has";
	if (lastChar == "s") {
		plural = " have";
	}
	
	return plural;
}

function GetAddItemErrorSpeechResponse(listDetails) {
	var speechOutput = "Sorry, there was a problem. Failed to add " + listDetails.item + " to " + listDetails.listTitle + "!";	
	return buildSpeechletResponseWithoutCard(speechOutput, "", true)
}

function GetListOfItemsSpeechResponse(body, list) {
	
	var items = JSON.parse(body);
	var listOfItems = ListOfItemsToString(items);		
										
	var speechOutput = "In " + list + " you have " + listOfItems;
	
	return buildSpeechletResponseWithoutCard(speechOutput, "", true)	
	
}

function BuildRequestHeaders() {

	return {
				'x-access-token': apiAccessToken,
				'x-client-id': apiClientId,
				'content-type': 'application/json'
			};

}

function BuildAddItemJson(listId, item) {
	
	return { 
				list_id: listId,
				title: item,
				completed: false,
				starred: false
			}
}

function GetId(list) {
	
	if (list === "groceries") {
		return 165353142;
	}
	
	if (list === "test list") {
		return 285747132;
	}
	
	return 0;
}

function GetListDetails (intent) {
	
	var item = ""
	var list = intent.slots.List.value;
		
	if (list === undefined) {
		list = "groceries";
	}	

	if (intent.slots.Item != undefined) {
		item = intent.slots.Item.value;
	}
	
	var listId = GetId(list);
	
	var listDetails = {
						"listTitle" : list,
						"listId" : listId,
						"item" : item
					  }	
	
	return listDetails;	
}

function ListOfItemsToString(items) {
	
	var listOfItems = "";
	
	for(var i = 0; i < items.length; i++) {
		var itemTitle = items[i].title;
		var prefix = ", ";
		
		if (i == 0) {
			prefix = "";
		}
		
		if (i == items.length - 1) {
			prefix = " and "							
		} 					
								
		listOfItems = listOfItems + prefix + itemTitle;			
	}
	
	return listOfItems;	
}


function GetListOfItemsErrorSpeechResponse(list) {
	var speechOutput = "Sorry, there was a problem. Failed to list items for " + list + "!";	
	return buildSpeechletResponseWithoutCard(speechOutput, "", true)
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}