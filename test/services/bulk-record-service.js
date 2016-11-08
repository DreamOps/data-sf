var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var bulkRecordServiceFactory = require('./../../src/services/bulk-record-service');
var testLogger = function(s) {};

describe('bulk-record-service', function() {
  describe('mapRelationshipFields', function() {
    var records;
    beforeEach(function() {
      records = [
        {
          'ExternalId__c': 'PRIMARY_MASTERCARD',
          'Entity__r': {'ExternalId__c': 'PRIMARY'},
          'CreditCardIssuer__r': {'ExternalId__c': 'MASTERCARD'},
          'BankAccount__r': {'ExternalId__c': 'PRIMARY_CASH'},
          'Status__c': 'Active'
        },
        {
          'ExternalId__c': 'PRIMARY_AMEX',
          'Entity__r': {'ExternalId__c': 'PRIMARY'},
          'CreditCardIssuer__r': {'ExternalId__c': 'AMEX'},
          'BankAccount__r': {'ExternalId__c': 'PRIMARY_CASH'},
          'Status__c': 'Active'
        }
      ];
      var loginMock = sinon.stub();
      bulkRecordService = bulkRecordServiceFactory(loginMock, promise, testLogger);
    });

    it('maps fields that end with __r', function() {
      var result = bulkRecordService.mapRelationshipFields(records);
      expect(result).to.be.an.instanceof(Array);
      expect(result.length).to.be.equal(2);
      expect(result[0]['Entity__r.ExternalId__c']).to.be.equal('PRIMARY');
      expect(result[0]['CreditCardIssuer__r.ExternalId__c']).to.be.equal('MASTERCARD');
      expect(result[0]['BankAccount__r.ExternalId__c']).to.be.equal('PRIMARY_CASH');
      expect(result[1]['Entity__r.ExternalId__c']).to.be.equal('PRIMARY');
      expect(result[1]['CreditCardIssuer__r.ExternalId__c']).to.be.equal('AMEX');
      expect(result[1]['BankAccount__r.ExternalId__c']).to.be.equal('PRIMARY_CASH');
    });

    it('does not map fields that do not end with __r', function() {
      var result = bulkRecordService.mapRelationshipFields(records);
      expect(result).to.be.an.instanceof(Array);
      expect(result.length).to.be.equal(2);
      expect(result[0].ExternalId__c).to.be.equal('PRIMARY_MASTERCARD');
      expect(result[0].Status__c).to.be.equal('Active');
      expect(result[1].ExternalId__c).to.be.equal('PRIMARY_AMEX');
      expect(result[1].Status__c).to.be.equal('Active');
    });

    it('does not map fields whose values are not objects', function() {
      records.push({'Entity__r': 'somestring'});
      var result = bulkRecordService.mapRelationshipFields(records);
      expect(result).to.be.an.instanceof(Array);
      expect(result.length).to.be.equal(3);
      expect(result[2].Entity__r).to.be.equal('somestring');
    });
  });

  describe('insertRecords', function() {
    var bulkRecordService;
    var loginMock;
    var connectionMock;
    var createJobMock;
    var records;
    var jobMock;
    var batchMock;
    beforeEach(function() {
      records = [{Id: 1},{Id: 2}];
      batchMock = {
        on: sinon.stub().callsArgWith(1, {jobId: 1, batchId: 'abc123'}),
        poll: sinon.stub(),
        execute: sinon.stub()
      };
      var jobInfo = {
        object: 'Account',
        numberBatchesTotal: '1',
        numberRecordsProcessed: '2',
        totalProcessingTime: '1303'
      };
      jobMock = {
        createBatch: sinon.stub().returns(batchMock),
        on: sinon.stub().callsArgWith(1, jobInfo),
        close: sinon.stub()
      };
      createJobMock = sinon.stub().returns(jobMock);
      connectionMock = {
        bulk: {
          createJob: createJobMock
        }
      };
      loginMock = sinon.stub().resolves(connectionMock);
      bulkRecordService = bulkRecordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledOnce).to.be.true;
        done();
      });
    });

    it('Expect batchMock.on called with queue', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(batchMock.on.calledWith('queue')).to.be.true;
        done();
      });
    });

    it('Expect batchMock.poll called with correct timeouts', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(batchMock.poll.calledWith(1000, 200000)).to.be.true;
        done();
      });
    });

    it('Expect batchMock.execute called with records', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(batchMock.execute.calledWith(records)).to.be.true;
        done();
      });
    });

    it('Expect jobMock.createBatch called', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(jobMock.createBatch.called).to.be.true;
        done();
      });
    });

    it('Expect jobMock.on called', function(done) {
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(jobMock.on.calledWith('close')).to.be.true;
        done();
      });
    });

    it('Expect jobMock.close called', function(done) {
      batchMock.execute.callsArgWith(1, null, []);
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(jobMock.close.called).to.be.true;
        done();
      });
    });

    it('Expect promise rejected when batchMock.execute calls with error', function(done) {
      batchMock.execute.callsArgWith(1, 'error', null);
      jobMock.on.reset();
      bulkRecordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(reason) {
        expect(reason).to.be.equal('error');
        expect(jobMock.close.called).to.be.false;
        expect(jobMock.createBatch.called).to.be.true;
        expect(batchMock.execute.calledWith(records)).to.be.true;
        expect(batchMock.poll.calledWith(1000, 200000)).to.be.true;
        expect(batchMock.on.calledWith('queue')).to.be.true;
        done();
      });
    });
  });
});
