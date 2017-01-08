var expect = require('chai').expect;
var index = require('../index');
 
const context = require('aws-lambda-mock-context');
const ctx = context();
 
describe("Testing a session with the AMAZON.HelpIntent.", function() {
    var speechResponse = null
    var speechError = null
 
    before(function(done){
        index.handler({
            "session": {
                "sessionId": "SessionId.154291c5-a13f-4e7a-ab5a-2342534adfeba",
                "application": {
                    "applicationId": "amzn1.ask.skill.8ce4061e-150b-4b92-b1dd-202c85dcf24d"
            },
            "attributes": {},
            "user": {
                "userId": null
            },
            "new": true
            },
            "request": {
                "type": "IntentRequest",
                "requestId": "EdwRequestId.474c15c8-14d2-4a77-a4ce-154291c5",
                "timestamp": "2016-07-05T22:02:01Z",
                "intent": {
                    "name": "AMAZON.HelpIntent",
                    "slots": { }
                },
                "locale": "en-US"
            },
            "version": "1.0"
        }, ctx)
 
        ctx.Promise
            .then(resp => { speechResponse = resp; done(); })
            .catch(err => { speechError = err; done(); })
    })
	
	describe("The help intent", function() {
		
		it('should not have errored',function() {
            expect(speechError).to.be.null
        })
		
		it('should have a version',function() {				
            expect(speechResponse.version).not.to.be.null
        })
		
		it('should have a speechlet response', function() {
            expect(speechResponse.response).not.to.be.null
        })
		
		it("should have a spoken response", () => {
            expect(speechResponse.response.outputSpeech).not.to.be.null
        })
		
		 it("should end the alexa session", function() {
            expect(speechResponse.response.shouldEndSession).not.to.be.null
            expect(speechResponse.response.shouldEndSession).to.be.true
        }) 
	})

})