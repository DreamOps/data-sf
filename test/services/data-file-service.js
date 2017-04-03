var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var dataFileServiceFactory = require('./../../src/services/data-file-service');

describe('data-file-service', function() {

  var dataFileJson = {
    'extId': 'ExternalId__c',
    'queries': [
      {
          'variable': 'Entity',
          'query': 'SELECT Id, Name FROM Entity__c WHERE Name LIKE \'Inter%\''
      },
      {
          'variable': 'GlAccount',
          'query': 'SELECT Id, Name FROM GLAccount__c WHERE Name LIKE \'01-%\' LIMIT 1'
      }
    ],
    'records': {
      'Event__c': [
        {
          'Name': 'Test Event',
          'ShortName__c': 'TE',
          'Status__c': 'Active',
          'Entity__c': '${Entity.Id}',
          'StartDate__c': '2016-04-22T08:00:00Z',
          'EndDate__c': '2016-04-25T08:00:00Z',
          'ExternalId__c': 'TestEvent'
        }
      ],
      'Product__c': [
        {
          'Name': 'Test Donation Product',
          'Entity__c': '${Entity.Id}',
          'DisplayOrder__c': 1,
          'QuantityMax__c': 1,
          'ListPrice__c': 10.00,
          'RevenueGLAccount__c': '${GlAccount.Id}',
          'ExternalId__c': 'TestDonationProduct'
        }
      ]
    },
    'cleaners': [
      {
        'type': 'ApexScript',
        'body': [
          'List<Event__c> events = [SELECT Id FROM Event__c WHERE ExternalId__c=\'TestEvent\'];',
          'List<Product__c> products = [SELECT Id FROM Product__c WHERE ExternalId__c];',
          'delete products;',
          'delete events;'
        ]
      },
      {
        'type': 'ApexScript',
        'body': [
          'List<Event__c> events = [SELECT Id FROM Event__c WHERE ExternalId__c=\'TestEvent\'];',
          'List<Product__c> products = [SELECT Id FROM Product__c WHERE ExternalId__c];',
          'delete products;',
          'delete events;'
        ]
      }
    ]
  };

  describe('processData', function() {
    var dataFileService;
    var environmentMock;
    var recordServiceMock;
    beforeEach(function() {
      environmentMock = {
        buildEnvironment: sinon.stub().resolves({}),
        replaceVariables: sinon.stub().returnsArg(0)
      };
      recordServiceMock = {
        insertRecords: sinon.stub().resolves({})
      };
      dataFileService = dataFileServiceFactory(
        environmentMock,
        recordServiceMock,
        null,
        promise
      );
    });

    it('Expect environmentMock.buildEnvironment called', function(done) {
      dataFileService.processData(dataFileJson).then(function() {
        expect(
          environmentMock.buildEnvironment.calledWith(dataFileJson.queries)
        ).to.be.true;
        done();
      });
    });

    it('Expect environmentMock.replaceVariables called twice', function(done) {
      dataFileService.processData(dataFileJson).then(function() {
        expect(environmentMock.replaceVariables.calledTwice).to.be.true;
        var firstCall = environmentMock.replaceVariables.getCall(0);
        var secondCall = environmentMock.replaceVariables.getCall(1);
        expect(firstCall.calledWith(dataFileJson.records.Event__c, {})).to.be.true;
        expect(secondCall.calledWith(dataFileJson.records.Product__c, {})).to.be.true;
        done();
      });
    });

    it('Expect recordServiceMock.insertRecords called twice', function(done) {
      dataFileService.processData(dataFileJson).then(function() {
        expect(recordServiceMock.insertRecords.calledTwice).to.be.true;
        var firstCall = recordServiceMock.insertRecords.getCall(0);
        var secondCall = recordServiceMock.insertRecords.getCall(1);
        expect(
          firstCall.calledWith('Event__c', dataFileJson.records.Event__c, dataFileJson.extId)
        ).to.be.true;
        expect(
          secondCall.calledWith('Product__c', dataFileJson.records.Product__c, dataFileJson.extId)
        ).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when buildEnvironment rejects', function(done) {
      environmentMock.buildEnvironment.reset().rejects('this is an error');
      dataFileService.processData(dataFileJson).then(function() {
        expect(false).to.be.true;
        done();
      }, function(reason) {
        expect(reason.message).to.be.equal('this is an error');
        expect(environmentMock.buildEnvironment.called).to.be.true;
        expect(environmentMock.replaceVariables.called).to.be.false;
        expect(recordServiceMock.insertRecords.called).to.be.false;
        done();
      });
    });

    it('Expect promise rejection when insertRecords rejects', function(done) {
      recordServiceMock.insertRecords.reset().rejects('this is an error');
      dataFileService.processData(dataFileJson).then(function() {
        expect(false).to.be.true;
        done();
      }, function(reason) {
        expect(reason.message).to.be.equal('this is an error');
        expect(environmentMock.buildEnvironment.called).to.be.true;
        expect(environmentMock.replaceVariables.called).to.be.true;
        expect(recordServiceMock.insertRecords.called).to.be.true;
        done();
      });
    });
  });

  describe('cleanData', function() {
    var dataFileService;
    var executeMock;
    beforeEach(function() {
      executeMock = sinon.stub().resolves({});
      dataFileService = dataFileServiceFactory(
        null,
        null,
        executeMock,
        promise
      );
    });

    it('Expect all cleaner objects run from data file', function(done) {
      dataFileService.cleanData(dataFileJson.cleaners).then(function() {
        expect(executeMock.calledTwice).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when executeMock rejects', function(done) {
      executeMock.reset().rejects('error');
      dataFileService.cleanData(dataFileJson.cleaners).then(function() {
        expect(false).to.be.true;
        done();
      }, function(reason) {
        expect(reason.message).to.be.equal('error');
        expect(executeMock.called).to.be.true;
        done();
      });
    });
  });

  describe('writeDataFile', function() {
    var dataFileService;
    var fsMock;
    var records;
    var destinationFile;
    var type;
    var extId;
    var queries;
    beforeEach(function() {
      records = [{Id: 1}, {Id: 2}];
      queries = [{query: 'yerp'}, {query: 'yurp'}];
      extId = 'EXTERNALID';
      type = 'Account';
      destinationFile = 'Path/to/destination/file.json';
      fsMock = {
        writeFile: sinon.stub()
      };
      dataFileService = dataFileServiceFactory(
        null,
        null,
        null,
        null,
        fsMock
      );
    });

    it('calls fs with destination file', function() {
      dataFileService.writeDataFile(
        records,
        destinationFile,
        type,
        extId,
        queries
      );
      expect(fsMock.writeFile.calledWith(destinationFile)).to.be.true;
    });

    it('Expect extId set', function() {
      dataFileService.writeDataFile(
        records,
        destinationFile,
        type,
        extId,
        queries
      );
      var jsonArg = JSON.parse(fsMock.writeFile.getCall(0).args[1]);
      expect(jsonArg.extId).to.be.eq(extId);
    });

    it('Expect queries default set', function() {
      dataFileService.writeDataFile(
        records,
        destinationFile,
        type,
        extId,
        null
      );
      var jsonArg = JSON.parse(fsMock.writeFile.getCall(0).args[1]);
      expect(jsonArg.queries).to.be.instanceOf(Array);
      expect(jsonArg.queries.length).to.be.eq(0);
    });

    it('Expect records set', function() {
      dataFileService.writeDataFile(
        records,
        destinationFile,
        type,
        extId,
        null
      );
      var jsonArg = JSON.parse(fsMock.writeFile.getCall(0).args[1]);
      expect(jsonArg.records).to.be.instanceOf(Object);
      expect(jsonArg.records[type]).to.be.instanceOf(Array);
      expect(jsonArg.records[type].length).to.be.eq(2);
      expect(jsonArg.records[type][0].Id).to.be.eq(1);
      expect(jsonArg.records[type][1].Id).to.be.eq(2);
    });
  });

  describe('writeManifestFile', function() {
    var dataFileService;
    var fsMock;
    var fileNames;
    var destinationFile;
    beforeEach(function() {
      destinationFile = 'Path/to/destination/file.json';
      fileNames = ['1', '2', '3'];
      fsMock = {
        writeFile: sinon.stub()
      };
      dataFileService = dataFileServiceFactory(
        null,
        null,
        null,
        null,
        fsMock
      );
    });

    it('calls fs with destination file', function() {
      dataFileService.writeManifestFile(
        destinationFile,
        fileNames
      );
      expect(fsMock.writeFile.calledWith(destinationFile)).to.be.true;
    });

    it('calls fs with templateManifest', function() {
      dataFileService.writeManifestFile(
        destinationFile,
        fileNames
      );
      var jsonArg = JSON.parse(fsMock.writeFile.getCall(0).args[1]);
      expect(jsonArg.order).to.be.instanceOf(Array);
      expect(jsonArg.order.length).to.be.eq(3);
      expect(jsonArg.order[0]).to.be.eq('1');
      expect(jsonArg.order[1]).to.be.eq('2');
      expect(jsonArg.order[2]).to.be.eq('3');
      expect(jsonArg.manifest).to.be.eq(true);
    });
  });
});
