var sinon = require('sinon');
var expect = require('chai').expect;
var connectionServiceFactory = require('./../../src/services/connection-service');

describe('connection-service', function() {
  describe('logs in with username and password', function() {
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
      connection = connectionServiceFactory(jsforceMock, configMock);
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

  describe('logs in with client id and private key', function() {
    var connection;
    var jsforceMock;
    var connectionMock;
    beforeEach(function() {
      var configMock = {
        instanceUrl: 'data',
        clientId: 'asdfasdf',
        jwt: 'somethingprivate'
      };
      var sfjwtmock = {
        getToken: sinon.stub()
      };
      connectionMock = sinon.stub();
      jsforceMock = {
        Connection: function(opts) {
          return {
            initialize: connectionMock,
            login: connectionMock
          };
        }
      };
      sfjwtmock.getToken.callsArgWith(3, null, 'AccessToken');
      connection = connectionServiceFactory(jsforceMock, configMock);
    });

    it('Expect connectionMock called for initialize', function(done) {
      connection().then(function() {
        expect(connectionMock.called).to.be.true;
        done();
      });
    });

    it('Expect connectionMock called only once', function(done) {
      connection().then(function() {
        connection().then(function() {
          expect(connectionMock.called).to.be.true;
          expect(connectionMock.calledOnce).to.be.true;
          done();
        });
      });
    });
  });
});
