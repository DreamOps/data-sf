# nimbleforce

> Grunt tasks for NimbleAMS installations
>

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install nimbleforce --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('nimbleforce');
```

### Configuration ###
```json
nimbleforce: {
  username: 'qa-123@nu.dev',
  password: 'Honor1234',
  sfUrl: 'https://login.salesforce.com',
  nuClassNamespace: 'NU.',
  nuObjectNamespace: 'NU__',
  ncObjectNamespace: 'NC__'
}
```

### Grunt Tasks for data ###

```
grunt data:path/to/data/file.json
grunt cleanData:path/to/data/file.json
```
Let's take a deeper look at one of these files.

```json
{
  "queries": [
    {
        "variable": "Entity",
        "query": "SELECT Id, Name FROM NU__Entity__c WHERE Name LIKE 'Inter%'"
    }
  ],
  "records": {
    "NU__Event__c": [
      {
        "Name": "Test Event",
        "NU__ShortName__c": "TE",
        "NU__Status__c": "Active",
        "NU__Entity__c": "${Entity.Id}",
        "NU__StartDate__c": "2016-04-22T08:00:00Z",
        "NU__EndDate__c": "2016-04-25T08:00:00Z",
        "NU__ExternalId__c": "TestEvent"
      }
    ],
    "Account": [
      {
        "FirstName": "Test",
        "LastName": "Account",
        "NU__PersonEmail__c": "test.account@example.com",
        "NU__ExternalId__c": "TestAccount"
      }
    ]
  },
  "cleaners": [
    {
      "type": "ApexScript",
      "body": [
        "NU.TriggerHandlerManager.disableTriggerForThisRequest('MembershipTrigger');",
        "List<NU__Order__c> os = [SELECT Id FROM NU__Order__c WHERE NU__BillTo__r.NU__ExternalId__c = 'TestAccount'];",
        "Set<Id> orderIds = NU.CollectionUtil.getSObjectIds(os);",
        "List<NU__OrderItem__c> ois = [SELECT Id FROM NU__OrderItem__c WHERE NU__Order__c in :orderIds];",
        "Set<Id> orderItemIds = NU.CollectionUtil.getSObjectIds(ois);",
        "List<NU__OrderItemLine__c> oils = [SELECT Id FROM NU__OrderItemLine__c WHERE NU__OrderItem__c in :orderItemIds];",
        "Set<Id> orderItemLineIds = NU.CollectionUtil.getSObjectIds(oils);",
        "List<NU__Membership__c> memberships = [SELECT Id FROM NU__Membership__c WHERE NU__OrderItemLine__c in :orderItemLineIds];",
        "delete memberships;"
      ]
    }
  ]
}
```
In this JSON file we have 3 top level properties. The first property is "queries" which is an array of objects.
Each query object defines a variable and a query to execute, the queries are evaluated before the rest of the
properties so that the other sections can use the resulting variables in expressions.

The next property is the "records" property. The records property is an object who's keys are SObjectTypes
i.e. NU\_\_Event\_\_c or Account. Each SObjectType is evaluated and inserted in the order they appear in the records
property. So in this example the NU\_\_Event\_\_c is inserted before the Account. Notice each of the records has an
ExternalId defined. Finally the NU\_\_Entity\_\_c field of the NU\_\_Event\_\_c object has an expression syntax: #{Entity.Id}.
That syntax is referencing the Entity variable from our queries property, and asking for the result's Id field.

Finally the "cleaners" property defines an array of json objects. The json objects represent certain ways to clean data.
Currently there is support for ApexScripts, which are executed anonymously in the org referenced in the nimbleforce task configuration.
You can see in this example that we are selecting all Order,OrderItem,OrderItemLines,Memberships from the org that belong
to the TestAccount, and then we are deleting the resulting memberships.

### Manifest support ###

You can also upload or clean from a collection of data files. A manifest file can be used to include an order for the files.
Call the tool from the command line in the exact same way, except reference a manifest file that lives in the same directory
as the rest of the data files.

```json
{
    "manifest": true,
    "order": [
        "NU__BatchExportConfiguration__c.json",
        "NU__SelfServiceRecoveryQuestion__c.json",
        "NU__CommitteePosition__c.json"
   ]
}

```
