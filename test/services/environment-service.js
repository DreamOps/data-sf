var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var environmentServiceFactory = require('./../../src/services/environment-service');

describe('environment-service', function() {
  describe('queryData', function() {
    it('Expect a single record returned when results only contain 1', function() {
      var results = [{Id:1}];
      var queryMock = sinon.stub().resolves(results);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.queryData({
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(actualResult).to.be.an.instanceof(Object);
        expect(actualResult.Id).to.be.equal(1);
      });
    });

    it('Expect all records returned when more than one records is returned by the query', function() {
      var results = [{Id:1}, {Id:2}];
      var queryMock = sinon.stub().resolves(results);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.queryData({
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(actualResult).to.be.an.instanceof(Array);
        expect(actualResult.length).to.be.equal(2);
        expect(actualResult[0].Id).to.be.equal(1);
        expect(actualResult[1].Id).to.be.equal(2);
      });
    });

    it('Expect promise rejection when queryMock rejects', function() {
      var reason = 'An error has occured.';
      var queryMock = sinon.stub().rejects(reason);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.queryData({
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }).then(function(actualResult) {
        expect(false).to.be.true;
      }, function (actualReason) {
        expect(queryMock.called).to.be.true;
        expect(actualReason).to.be.equal(reason);
      });
    });
  });

  describe('buildEnvironment', function() {
    it('Expect queryMock to be called', function() {
      var results = [{Id:1}];
      var queryMock = sinon.stub().resolves(results);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(queryMock.called).to.be.true;
        expect(queryMock.calledTwice).to.be.true;
        expect(actualResult).to.be.an.instanceof(Object);
        expect(actualResult).to.have.property('someVariable', 'someOtherVariable');
      });
    });

    it('Expect promise rejection when queryMock rejects', function() {
      var reason = 'An error has occured.';
      var queryMock = sinon.stub().rejects(reason);
      var environment = environmentServiceFactory(queryMock, promise);
      environment.buildEnvironment([{
        variable: 'someVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      },{
        variable: 'someOtherVariable',
        query: 'SELECT Id FROM SomeVariable__c'
      }]).then(function(actualResult) {
        expect(false).to.be.true;
      }, function(actualReason) {
        expect(queryMock.called).to.be.true;
        expect(actualReason).to.be.equal(reason);
      });
    });
  });

  describe('replaceVariables', function() {
    it('Expect replacement of ${variale.property} expressions', function() {
      var env = {
        someVariable: { Id:1 },
        someOtherVariable: { differentFieldName: 'string' }
      };
      var records = [
        {
          field1: '${someVariable.Id}'
        },
        {
          field1: '${someOtherVariable.differentFieldName}'
        }
      ];
      var environment = environmentServiceFactory(null, null);
      var newRecords = environment.replaceVariables(records, env);
      expect(newRecords).to.be.instanceof(Array);
      expect(newRecords.length).to.be.equal(2);
      expect(newRecords[0].field1).to.be.equal('1');
      expect(newRecords[1].field1).to.be.equal('string');
    });

    it('Expect missing variables not replaced', function() {
      var env = { someVariable: { Id:1 } };
      var records = [
        {
          field1: '${someOtherVariable.Id}'
        }
      ];
      var environment = environmentServiceFactory(null, null);
      var newRecords = environment.replaceVariables(records, env);
      expect(newRecords).to.be.instanceof(Array);
      expect(newRecords.length).to.be.equal(1);
      expect(newRecords[0].field1).to.be.equal('${someOtherVariable.Id}');
    });
  });
});

