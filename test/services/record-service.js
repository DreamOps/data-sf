var sinon = require('sinon');
var promise = require('promised-io/promise');
var lodash = require('lodash');
require('sinon-as-promised');
var expect = require('chai').expect;
var recordServiceFactory = require('./../../src/services/record-service');
var testLogger = function(s) {};

describe('record-service', function() {
  describe('deleteRecord', function() {
    var recordService;
    var loginMock;
    var deleteMock;
    beforeEach(function() {
      deleteMock = sinon.stub();
      var connectionMock = {
        del: deleteMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      deleteMock.callsArgWith(2, null, 'delete success');
      recordService.deleteRecord('Account', '1').then(function() {
        expect(loginMock.called).to.be.true;
        done();
      });
    });

    it('Expect deleteMock called', function(done) {
      deleteMock.callsArgWith(2, null, 'delete success');
      recordService.deleteRecord('Account', '1').then(function() {
        expect(loginMock.called).to.be.true;
        expect(deleteMock.calledWith('Account', '1')).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when deleteMock rejects', function(done) {
      deleteMock.callsArgWith(2, 'error occured', null);
      recordService.deleteRecord('Account', '1').then(function() {
        expect(true).to.be.false;
        done();
      }, function(reason) {
        expect(deleteMock.calledWith('Account', '1')).to.be.true;
        expect(reason).to.be.equal('error occured');
        done();
      });
    });
  });

  describe('insertRecord', function() {
    var recordService;
    var loginMock;
    var sobjectMock;
    var upsertMock;
    var insertMock;
    beforeEach(function() {
      upsertMock = sinon.stub();
      insertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock,
        insert: insertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      insertMock.callsArgWith(1, null, 'insert success');
      recordService.insertRecord('Account', {Id: 1})
      .then(function() {
        expect(loginMock.called).to.be.true;
        done();
      },function(err) {
      console.log(err);
      done();
      });
    });

    it('Expect sobjectMock called', function(done) {
      insertMock.callsArgWith(1, null, 'insert success');
      recordService.insertRecord('Account', {Id: 1})
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        done();
      });
    });

    it('Expect upsertMock called', function(done) {
      insertMock.callsArgWith(1, null, 'insert success');
      recordService.insertRecord('Account', {Id: 1})
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(insertMock.calledWith({Id: 1})).to.be.true;
        done();
      });
    });

    it('Expect promise resolves when upsertMock rejects', function(done) {
      insertMock.callsArgWith(1, 'error occured', null);
      recordService.insertRecord('Account', {Id: 1})
      .then(function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(insertMock.calledWith({Id: 1})).to.be.true;
        done();
      });
    });
  });

  describe('insertRecords', function() {
    var recordService;
    var loginMock;
    var sobjectMock;
    var upsertMock;
    var insertMock;
    var records;
    beforeEach(function() {
      records = [{Id: 1},{Id: 2}];
      upsertMock = sinon.stub();
      insertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock,
        insert: insertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      insertMock.callsArgWith(1, null);
      recordService.insertRecords('Account', records)
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        done();
      });
    });

    it('Expect sobjectMock called', function(done) {
      insertMock.callsArgWith(1, null, 'insert success');
      recordService.insertRecords('Account', records)
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(sobjectMock.calledTwice).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        done();
      });
    });

    it('Expect insertMock called', function(done) {
      insertMock.callsArgWith(1, null);
      recordService.insertRecords('Account', records)
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(insertMock.calledTwice).to.be.true;
        var firstCall = insertMock.getCall(0);
        var secondCall = insertMock.getCall(1);
        expect(firstCall.calledWith(records[0])).to.be.true;
        expect(secondCall.calledWith(records[1])).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when insertMock rejects', function(done) {
      insertMock.callsArgWith(1, 'error occured', null);
      recordService.insertRecords('Account', records)
      .then(function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledTwice).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(insertMock.calledTwice).to.be.true;
        var firstCall = insertMock.getCall(0);
        var secondCall = insertMock.getCall(1);
        expect(firstCall.calledWith(records[0])).to.be.true;
        expect(secondCall.calledWith(records[1])).to.be.true;
        done();
      });
    });
  });

  describe('upsertRecord', function() {
    var recordService;
    var loginMock;
    var sobjectMock;
    var upsertMock;
    var insertMock;
    beforeEach(function() {
      upsertMock = sinon.stub();
      insertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock,
        insert: insertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success', 'externalId');
      recordService.upsertRecord('Account', {Id: 1})
      .then(function() {
        expect(loginMock.called).to.be.true;
        done();
      },function(err) {
      console.log(err);
      done();
      });
    });

    it('Expect sobjectMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.upsertRecord('Account', {Id: 2}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        done();
      });
    });

    it('Expect upsertMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.upsertRecord('Account', {Id: 1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(upsertMock.calledWith({Id: 1}, 'externalId')).to.be.true;
        done();
      });
    });

    it('Expect promise resolves when upsertMock rejects', function(done) {
      upsertMock.callsArgWith(2, 'error occured', null);
      recordService.upsertRecord('Account', {Id: 1}, 'externalId')
      .then(function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(upsertMock.calledWith({Id: 1}, 'externalId')).to.be.true;
        done();
      });
    });
  });

  describe('upsertRecords', function() {
    var recordService;
    var loginMock;
    var upsertMock;
    var describeMock;
    var partnerServiceMock;
    var records;
    beforeEach(function() {
      records = [
        {Id: 1, 'Parent.externalId': 3},
        {Id: 2, Email: null}
      ];
      upsertMock = sinon.stub().resolves([]);
      describeMock = sinon.stub().resolves({
        fields: [{
          relationshipName: 'Parent',
          referenceTo: 'Account'
        }]
      });
      partnerServiceMock = {
        describeSObjects: describeMock,
        upsert: upsertMock,
      };
      recordService = recordServiceFactory(loginMock, promise, testLogger, partnerServiceMock, lodash);
    });

    it('Expect describeMock called', function(done) {
      recordService.upsertRecords('Account', records, 'externalId')
      .then(function() {
        expect(describeMock.calledOnce).to.be.true;
        expect(describeMock.calledWith(['Account'])).to.be.true;
        done();
      }).catch(done);
    });

    it('Expect upsertMock called', function(done) {
      recordService.upsertRecords('Account', records, 'externalId')
      .then(function() {
        expect(upsertMock.calledOnce).to.be.true;
        var call = upsertMock.getCall(0);
        expect(call.calledWith('externalId', [
          {
            type: 'Account',
            Id: 1,
            Parent: {type: 'Account', externalId: 3},
            externalId: 1
          },
          {
            type: 'Account',
            Id: 2,
            Email: {'@xsi:nil': 'true'},
            externalId: 2
          }
        ])).to.be.true;
        done();
      }).catch(done);
    });

    it('Expect promise rejection when upsertMock rejects', function(done) {
      upsertMock.throws('error occurred');
      recordService.upsertRecords('Account', records, 'externalId')
      .then(function() {
        done('Promise should not be resolved');
      }).catch(function(reason) {
        expect(reason.name).to.be.equal('error occurred');
        done();
      }).catch(done);
    });
  });
});
