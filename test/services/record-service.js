var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var recordServiceFactory = require('./../../src/services/record-service');

describe('record-service', function() {
  describe('deleteRecord', function() {
    var recordService, loginMock, deleteMock;
    beforeEach(function() {
      deleteMock = sinon.stub();
      var connectionMock = {
        del: deleteMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise);
    });

    it('Expect loginMock called', function() {
      deleteMock.callsArgWith(2, null, 'delete success');
      recordService.deleteRecord('Account', '1').then(function() {
        expect(loginMock.called).to.be.true;
      });
    });

    it('Expect loginMock called', function() {
      deleteMock.callsArgWith(2, null, 'delete success');
      recordService.deleteRecord('Account', '1').then(function() {
        expect(loginMock.called).to.be.true;
        expect(deleteMock.calledWith('Account', '1')).to.be.true;
      });
    });

    it('Expect promise rejection when deleteMock rejects', function() {
      deleteMock.callsArgWith(2, 'error occured', null);
      recordService.deleteRecord('Account', '1').then(function() {
        expect(true).to.be.false;
      }, function(reason) {
        expect(deleteMock.calledWith('Account', '1')).to.be.true;
        expect(reason).to.be.equal('error occured');
      });
    });
  });

  describe('insertRecord', function() {
    var recordService, loginMock, sobjectMock, upsertMock;
    beforeEach(function() {
      upsertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise);
    });

    it('Expect loginMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id:1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
      });
    });

    it('Expect sobjectMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id:1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(sobjectMock.calledWith('Account')).to.be.true;
      });
    });

    it('Expect upsertMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', {Id:1}, 'externalId')
      .then(function() {
        expect(loginMock.called).to.be.true;
        expect(upsertMock.calledWith({Id:1}, 'externalId')).to.be.true;
      });
    });

    it('Expect promise rejection when upsertMock rejects', function() {
      upsertMock.callsArgWith(2, 'error occured', null);
      recordService.insertRecord('Account', {Id:1}, 'externalId')
      .then(function() {
        expect(true).to.be.false;
      }, function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledWith('Account')).to.be.true;
        expect(upsertMock.calledWith({Id:1}, 'externalId')).to.be.true;
      });
    });
  });

  describe('insertRecords', function() {
    var recordService, loginMock, sobjectMock, upsertMock, records;
    beforeEach(function() {
      records = [{Id:1},{Id:2}];
      upsertMock = sinon.stub();
      sobjectMock = sinon.stub().returns({
        upsert: upsertMock
      });
      var connectionMock = {
        sobject: sobjectMock
      };
      loginMock = sinon.stub().resolves(connectionMock);
      recordService = recordServiceFactory(loginMock, promise);
    });

    it('Expect loginMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
      });
    });

    it('Expect sobjectMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(sobjectMock.calledTwiceWith('Account')).to.be.true;
      });
    });

    it('Expect upsertMock called', function() {
      upsertMock.callsArgWith(2, null, 'upsert success');
      recordService.insertRecord('Account', records, 'externalId')
      .then(function() {
        expect(loginMock.calledTwice).to.be.true;
        expect(upsertMock.calledTwice).to.be.true;
        var firstCall = upsertMock.getCall(0);
        var secondCall = upsertMock.getCall(1);
        expect(firstCall.calledWith({Id:1}, 'externalId')).to.be.true;
        expect(secondCall.calledWith({Id:2}, 'externalId')).to.be.true;
      });
    });

    it('Expect promise rejection when upsertMock rejects', function() {
      upsertMock.callsArgWith(2, 'error occured', null);
      recordService.insertRecord('Account', records, 'externalId')
      .then(function() {
        expect(true).to.be.false;
      }, function(reason) {
        expect(reason).to.be.equal('error occured');
        expect(sobjectMock.calledTwiceWith('Account')).to.be.true;
        expect(upsertMock.calledTwice).to.be.true;
        var firstCall = upsertMock.getCall(0);
        var secondCall = upsertMock.getCall(1);
        expect(firstCall.calledWith({Id:1}, 'externalId')).to.be.true;
        expect(secondCall.calledWith({Id:2}, 'externalId')).to.be.true;
      });
    });
  });
});
