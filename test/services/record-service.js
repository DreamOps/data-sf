var sinon = require('sinon');
var promise = require('promised-io/promise');
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
    beforeEach(function() {
      upsertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id: 1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        done();
      });
    });

    it('Expect sobjectMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id: 1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        done();
      });
    });

    it('Expect upsertMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id: 1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(upsertMock.calledWith({Id: 1}, 'externalId')).to.be.true;
        done();
      });
    });

    it('Expect promise resolves when upsertMock rejects', function(done) {
      upsertMock.callsArgWith(2, 'error occured', null);
      recordService.insertRecord('Account', {Id: 1}, 'externalId')
      .then(function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(upsertMock.calledWith({Id: 1}, 'externalId')).to.be.true;
        done();
      });
    });
  });

  describe('insertRecords', function() {
    var recordService;
    var loginMock;
    var sobjectMock;
    var upsertMock;
    var records;
    beforeEach(function() {
      records = [{Id: 1},{Id: 2}];
      upsertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise, testLogger);
    });

    it('Expect loginMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        done();
      });
    });

    it('Expect sobjectMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(sobjectMock.calledTwice).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        done();
      });
    });

    it('Expect upsertMock called', function(done) {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecords('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(upsertMock.calledTwice).to.be.true;
        var firstCall = upsertMock.getCall(0);
        var secondCall = upsertMock.getCall(1);
        expect(firstCall.calledWith(records[0], 'externalId')).to.be.true;
        expect(secondCall.calledWith(records[1], 'externalId')).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when upsertMock rejects', function(done) {
      upsertMock.callsArgWith(2, 'error occured', null);
      recordService.insertRecords('Account', records, 'externalId')
      .then(function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledTwice).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(upsertMock.calledTwice).to.be.true;
        var firstCall = upsertMock.getCall(0);
        var secondCall = upsertMock.getCall(1);
        expect(firstCall.calledWith(records[0], 'externalId')).to.be.true;
        expect(secondCall.calledWith(records[1], 'externalId')).to.be.true;
        done();
      });
    });
  });
});
