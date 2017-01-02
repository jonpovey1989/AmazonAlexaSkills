# Wunderlist

Use this alexa skill to add items to a list.

**Installing dependencies**
- This alexa skill has been created using node.js and modules must be installed before uplaoding to the Amazon Lamba Management Console.
- Navigate to the the wunderlist folder in the command line and run "npm install".

**Upload to Lambda Management Console**
- Create a zip folder of the folder which src excluding package.json
- Naviagte to https://console.aws.amazon.com/lambda/
- Create a new function and upload the zip file to the code tab
- Set the trigger as an Amazon Alexa SKill
- Set xClientId and xAccessToken envrionment variables
- Set role as "lamba_basic_execution"
- Set timeout as 5 secs

**Create Alexa Skill**
- Naviagte to https://developer.amazon.com/edw/home.html#/skills/list and create a new skill
- Set language as English (U.K)
- Set name of skill as wunderlist. This will be used to activate alexa
- Setup the interaction model using files from the speechAssets folder
- Set configuration as NorthAmerica and set applicationId. This is stored in the Lambda Management Console in top right corner as a string prefixed with arn:

## Examples
Example user interactions:

### Default model:
    User: "Alexa, ask wunderlist to add eggs"
    Alexa: "Eggs have been added to groceries"

### Groveries model:
    User: "Alexa, ask wunderlist to add milk to groceries"
    Alexa: "Eggs have been added to groceries"

Groceries is the default list if none is specified
