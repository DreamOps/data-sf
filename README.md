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

##Local dev
You can also use this tool locally:

```shell
git clone git@bitbucket.org:nimbleams/nimbleforce.git
cd nimbleforce
npm install
```
And then run any grunt commands

### Configuration ###
```json
nimbleforce: {
  username: 'qa-123@nu.dev',
  password: 'Honor1234',
  sfUrl: 'https://login.salesforce.com',
  namespaces: {
    'NU__': 'znu__',
    'NC__': '',
    'NU.': 'znu.'
  },
  useBulkAPI: true || false
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
  "extId": "NU__ExternalId__c",
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

### Exporting Data ###

You can export data from an org with the export grunt task.

```shell
grunt export:path/to/queries/file.json:path/to/destination/dir
```

The export task will take SObjects from the org and export them into json data files in the destination directory.
It also generates a manifest file for upserting all the data to an org using the data task. The first argument is a
configuration file provided. See the following example:

```json
[
  {
    "name": "Batch Export Config",
    "useBulk": true,
    "query": "SELECT Id, Name, NU__ExportGenerator__c, NU__ExternalID__c FROM NU__BatchExportConfiguration__c",
    "type": "NU__BatchExportConfiguration__c",
    "id": "NU__ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "NU__ExternalID__c"
      }
    ]
  },
  {
    "name": "Committee Position",
    "query": "SELECT Id, Name, NU__ExternalID__c, NU__SortOrder__c FROM NU__CommitteePosition__c",
    "type": "NU__CommitteePosition__c",
    "id": "NU__ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "NU__ExternalID__c"
      }
    ]
  },
  {
    "name": "Entities",
    "query": "SELECT Id, Name, NU__AccountCreatedEmailTemplate__c, ... FROM NU__Entity__c",
    "type": "NU__Entity__c",
    "id": "NU__ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "NU__ExternalID__c"
      },
      {
        "sourceColumn": "NU__BatchExportConfiguration__c",
        "destColumn": "NU__BatchExportConfiguration__r.NU__ExternalID__c"
      }
    ]
  },
  ...
]
```

The configuration is based on queries. The query property is executed and then that returned set of records is
exported into the data file. The resulting file will be named the name property of the configuration (with the
spaces replaced with _). The id field will be used as the extId in the resulting data file. The mappings array
is the definition for transforming the resulting records, every sourceColumn will be copied into destColumn and
the source column is deleted. The mappings make handling relationships between objects easy (Check out the
Entities configuration). Order is important, as the resulting manifest file will preserve the order. So the order
you query the objects in is the order they get upserted into the destination (which is obviously configurable after
the fact as well).
