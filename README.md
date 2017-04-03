# data-sf

> Grunt tasks for NimbleAMS installations
>

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install data-sf --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('data-sf');
```

##Local dev
You can also use this tool locally:

```shell
git clone git@github.com:DreamOps/data-sf.git
cd data-sf
npm install
```
And then run any grunt commands

### Configuration ###
```json
datasf: {
  username: 'username@example.com',
  password: 'password',
  sfUrl: 'https://login.salesforce.com',
  namespaces: {
    'FOO__': 'BAR__'
  },
  useBulkAPI: true || false
}
```

### Grunt Tasks for data ###

A couple of useful grunt tasks for handling data and executing apex code.

```
grunt import:path/to/data/file.json
```
Let's take a deeper look at one of these files.

```json
{
  "extId": "ExternalId__c",
  "queries": [
    {
        "variable": "Entity",
        "query": "SELECT Id, Name FROM Entity__c WHERE Name LIKE 'Inter%'"
    }
  ],
  "records": {
    "Event__c": [
      {
        "Name": "Test Event",
        "ShortName__c": "TE",
        "Status__c": "Active",
        "Entity__c": "${Entity.Id}",
        "StartDate__c": "2016-04-22T08:00:00Z",
        "EndDate__c": "2016-04-25T08:00:00Z",
        "ExternalId__c": "TestEvent"
      }
    ],
    "Account": [
      {
        "FirstName": "Test",
        "LastName": "Account",
        "PersonEmail__c": "test.account@example.com",
        "ExternalId__c": "TestAccount"
      }
    ]
  }
}
```
In this JSON file we have 3 top level properties. The first property is "queries" which is an array of objects.
Each query object defines a variable and a query to execute, the queries are evaluated before the rest of the
properties so that the other sections can use the resulting variables in expressions.

The next property is the "records" property. The records property is an object who's keys are SObjectTypes
i.e. Event\_\_c or Account. Each SObjectType is evaluated and inserted in the order they appear in the records
property. So in this example the Event\_\_c is inserted before the Account. Notice each of the records has an
ExternalId defined. Finally the Entity\_\_c field of the Event\_\_c object has an expression syntax: #{Entity.Id}.
That syntax is referencing the Entity variable from our queries property, and asking for the result's Id field.

### Manifest support ###

You can also upload or clean from a collection of data files. A manifest file can be used to include an order for the files.
Call the tool from the command line in the exact same way, except reference a manifest file that lives in the same directory
as the rest of the data files.

```json
{
    "manifest": true,
    "order": [
        "Person__c.json",
        "Event__c.json",
        "Registration__c.json"
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
    "name": "Batch",
    "useBulk": true,
    "query": "SELECT Id, Name, ExportGenerator__c, ExternalID__c FROM Batch__c",
    "type": "Batch__c",
    "id": "ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "ExternalID__c"
      }
    ]
  },
  {
    "name": "Committee",
    "query": "SELECT Id, Name, ExternalID__c, SortOrder__c FROM Committee__c",
    "type": "Committee__c",
    "id": "ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "ExternalID__c"
      }
    ]
  },
  {
    "name": "Entities",
    "query": "SELECT Id, Name, Email__c FROM Entity__c",
    "type": "Entity__c",
    "id": "ExternalID__c",
    "mappings": [
      {
        "sourceColumn": "Id",
        "destColumn": "ExternalID__c"
      },
      {
        "sourceColumn": "BatchExportConfiguration__c",
        "destColumn": "BatchExportConfiguration__r.ExternalID__c"
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
