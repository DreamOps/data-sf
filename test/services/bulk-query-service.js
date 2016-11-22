var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var queryServiceFactory = require('./../../src/services/bulk-query-service');

describe('bulk-query-service', function() {
  var query;
  var loginMock;
  var connectionMock;
  var createJobMock;
  var records;
  var jobMock;
  var batchMock;
  var dataStreamMock;
  beforeEach(function() {
    dataStreamMock = {
      on: sinon.stub()
    };
    dataStreamMock.on.onCall(0).callsArgWith(1, {id: 1, data: 'stuff'});
    dataStreamMock.on.onCall(1).callsArgWith(1, null);
    batchMock = {
      on: sinon.stub().callsArgWith(1, {jobId: 1, batchId: 'abc123'}),
      poll: sinon.stub(),
      execute: sinon.stub().callsArgWith(1, null, [{id: 1}]),
      result: sinon.stub().returns(dataStreamMock)
    };
    jobMock = {
      createBatch: sinon.stub().returns(batchMock),
      on: sinon.stub().callsArgWith(1, 'info'),
      close: sinon.stub()
    };
    createJobMock = sinon.stub().returns(jobMock);
    connectionMock = {
      bulk: {
        createJob: createJobMock
      }
    };
    loginMock = sinon.stub().resolves(connectionMock);
    query = queryServiceFactory(loginMock, promise);
  });

  it('Expect loginMock called', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(loginMock.called).to.be.true;
      done();
    });
  });

  it('Expect batchMock.on called with queue', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(batchMock.on.calledWith('queue')).to.be.true;
      done();
    });
  });

  it('Expect batchMock.poll called with correct timeouts', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(batchMock.poll.calledWith(1000, 500000)).to.be.true;
      done();
    });
  });

  it('Expect batchMock.execute called with query', function(done) {
    var q = 'SELECT Id FROM Account';
    query(q).then(function() {
      expect(batchMock.execute.calledWith(q)).to.be.true;
      done();
    });
  });

  it('Expect jobMock.createBatch called', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(jobMock.createBatch.called).to.be.true;
      done();
    });
  });

  it('Expect jobMock.on called', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(jobMock.on.calledWith('close')).to.be.true;
      done();
    });
  });

  it('Expect jobMock.close called', function(done) {
    query('SELECT Id FROM Account').then(function() {
      expect(jobMock.close.called).to.be.true;
      done();
    });
  });

  it('Expect promise rejected when batchMock returns an error', function(done) {
    batchMock.execute.reset();
    batchMock.execute.callsArgWith(1, 'error', null);
    query('SELECT Id FROM Account').then(function() {
      expect(false).to.be.true;
      done();
    }, function(reason) {
      expect(reason).to.be.equal('error');
      expect(jobMock.close.called).to.be.false;
      expect(jobMock.createBatch.called).to.be.true;
      expect(batchMock.poll.calledWith(1000, 500000)).to.be.true;
      expect(batchMock.on.calledWith('queue')).to.be.true;
      done();
    });
  });
});

