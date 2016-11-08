var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var dataFileServiceFactory = require('./../../src/services/data-file-service');

describe('data-file-service', function() {

  var dataFileJson = {
    'extId': 'NU__ExternalId__c',
    'queries': [
      {
          'variable': 'Entity',
          'query': 'SELECT Id, Name FROM NU__Entity__c WHERE Name LIKE \'Inter%\''
      },
      {
          'variable': 'GlAccount',
          'query': 'SELECT Id, Name FROM NU__GLAccount__c WHERE Name LIKE \'01-%\' LIMIT 1'
      }
    ],
    'records': {
      'NU__Event__c': [
        {
          'Name': 'Test Event',
          'NU__ShortName__c': 'TE',
          'NU__Status__c': 'Active',
          'NU__Entity__c': '${Entity.Id}',
          'NU__StartDate__c': '2016-04-22T08:00:00Z',
          'NU__EndDate__c': '2016-04-25T08:00:00Z',
          'NU__ExternalId__c': 'TestEvent'
        }
      ],
      'NU__Product__c': [
        {
          'Name': 'Test Donation Product',
          'NU__Entity__c': '${Entity.Id}',
          'NU__DisplayOrder__c': 1,
          'NU__QuantityMax__c': 1,
          'NU__ListPrice__c': 10.00,
          'NU__RevenueGLAccount__c': '${GlAccount.Id}',
          'NU__ExternalId__c': 'TestDonationProduct'
        }
      ]
    },
    'cleaners': [
      {
        'type': 'ApexScript',
        'body': [
          'List<NU__Event__c> events = [SELECT Id FROM NU__Event__c WHERE NU__ExternalId__c=\'TestEvent\'];',
          'List<NU__Product__c> products = [SELECT Id FROM NU__Product__c WHERE NU__ExternalId__c];',
          'delete products;',
          'delete events;'
        ]
      },
      {
        'type': 'ApexScript',
        'body': [
          'List<NU__Event__c> events = [SELECT Id FROM NU__Event__c WHERE NU__ExternalId__c=\'TestEvent\'];',
          'List<NU__Product__c> products = [SELECT Id FROM NU__Product__c WHERE NU__ExternalId__c];',
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
        expect(firstCall.calledWith(dataFileJson.records.NU__Event__c, {})).to.be.true;
        expect(secondCall.calledWith(dataFileJson.records.NU__Product__c, {})).to.be.true;
        done();
      });
    });

    it('Expect recordServiceMock.insertRecords called twice', function(done) {
      dataFileService.processData(dataFileJson).then(function() {
        expect(recordServiceMock.insertRecords.calledTwice).to.be.true;
        var firstCall = recordServiceMock.insertRecords.getCall(0);
        var secondCall = recordServiceMock.insertRecords.getCall(1);
        expect(
          firstCall.calledWith('NU__Event__c', dataFileJson.records.NU__Event__c, dataFileJson.extId)
        ).to.be.true;
        expect(
          secondCall.calledWith('NU__Product__c', dataFileJson.records.NU__Product__c, dataFileJson.extId)
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
});
