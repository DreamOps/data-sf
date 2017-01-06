var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var exportServiceFactory = require('./../../src/services/export-service');

describe('export-service', function() {
  describe('export', function() {
    var loginMock;
    var records;
    var queryObjectMocks;
    var mockDataFileService;
    var destinationDir = 'test/directory';
    var queryObjectMock1;
    var queryObjectMock2;
    beforeEach(function() {
      records = [{Id: 1}, {Id: 2}];
      mockDataFileService = {
        writeDataFile: sinon.stub().resolves(),
        writeManifestFile: sinon.stub().resolves()
      };
      queryObjectMock1 = {
        doQuery: sinon.stub().resolves(),
        getFileName: sinon.stub(),
        getType: sinon.stub().resolves(),
        getId: sinon.stub(),
        records: records,
        queries: []
      };
      queryObjectMock2 = {
        doQuery: sinon.stub().resolves(),
        getFileName: sinon.stub(),
        getType: sinon.stub().resolves(),
        getId: sinon.stub(),
        records: records,
        queries: []
      };
      queryObjectMocks = [queryObjectMock1, queryObjectMock2];
      loginMock = sinon.stub().resolves();
      exportService = exportServiceFactory(
        loginMock,
        mockDataFileService,
        promise
      );
    });

    it('Expects loginMock called', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(loginMock.calledOnce).to.be.true;
        done();
      });
    });

    it('calls doQuery on both query objects', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(queryObjectMock1.doQuery.calledOnce).to.be.true;
        expect(queryObjectMock2.doQuery.calledOnce).to.be.true;
        done();
      });
    });

    it('calls getFileName on both query objects', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(queryObjectMock1.getFileName.calledTwice).to.be.true;
        expect(queryObjectMock2.getFileName.calledTwice).to.be.true;
        done();
      });
    });

    it('calls getType on both query objects', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(queryObjectMock1.getType.calledOnce).to.be.true;
        expect(queryObjectMock2.getType.calledOnce).to.be.true;
        done();
      });
    });

    it('calls getId on both query objects', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(queryObjectMock1.getId.calledOnce).to.be.true;
        expect(queryObjectMock2.getId.calledOnce).to.be.true;
        done();
      });
    });

    it('calls writeDataFile for both data files', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(mockDataFileService.writeDataFile.calledTwice).to.be.true;
        done();
      });
    });

    it('calls writeManifestFile for the operation', function(done) {
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(mockDataFileService.writeManifestFile.calledOnce).to.be.true;
        done();
      });
    });

    it('expects promise rejects for doQuery reject', function(done) {
      queryObjectMock1.doQuery.reset().rejects('error');
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for second doQuery reject', function(done) {
      queryObjectMock2.doQuery = sinon.stub().rejects('error');
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for writeDataFile reject', function(done) {
      mockDataFileService.writeDataFile.reset().rejects('error');
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });

    it('expects promise rejects for writeManifestFile reject', function(done) {
      mockDataFileService.writeManifestFile.reset().rejects('error');
      exportService.export(queryObjectMocks, destinationDir)
      .then(function() {
        expect(false).to.be.true;
        done();
      }, function(err) {
        expect(err.message).to.be.eq('error');
        done();
      });
    });
  });
});
