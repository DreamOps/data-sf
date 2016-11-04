var sinon = require('sinon');
var promise = require('promised-io/promise');
var expect = require('chai').expect;
var connectionServiceFactory = require('./../../src/services/connection-service');

describe('connection-service', function() {
  var connection;
  var jsforceMock;
  var connectionMock;
  beforeEach(function() {
    var configMock = {
      username: 'data',
      password: 'doesnt',
      url: 'Mata'
    };
    connectionMock = sinon.stub();
    jsforceMock = {
      Connection: function(opts) {
        return {
          login: connectionMock
        };
      }
    };
    connection = connectionServiceFactory(jsforceMock, promise, configMock);
  });

  afterEach(function() {
    connectionMock.reset();
  });

  it('Expect connectionMock called for login', function(done) {
    connectionMock.callsArgWith(2, null, true);
    connection().then(function() {
      expect(connectionMock.called).to.be.true;
      done();
    });
  });

  it('Expect connectionMock called only once', function(done) {
    connectionMock.callsArgWith(2, null, true);
    connection().then(function() {
      connection().then(function() {
        expect(connectionMock.called).to.be.true;
        expect(connectionMock.calledOnce).to.be.true;
        done();
      });
    });
  });

  it('Expect promise rejection when connectionMock rejects', function(done) {
    connectionMock.callsArgWith(2, 'An error has occured', false);
    connection().then(function() {
      expect(false);
    }, function(reason) {
      expect(connectionMock.called).to.be.true;
      expect(reason).to.be.equal('An error has occured');
      done();
    });
  });
});
