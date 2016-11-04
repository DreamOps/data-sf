var sinon = require('sinon');
var promise = require('promised-io/promise');
require('sinon-as-promised');
var expect = require('chai').expect;
var communityUserServiceFactory = require('./../../src/services/community-user-service');
var testLogger = function(s) {};

describe('community-user-service', function() {
  describe('deleteCommunityUser', function() {
    var communityUserService;
    var queryMock;
    var recordServiceMock;
    var userRecord;
    beforeEach(function() {
      userRecord = [{Id: 'abc123', AccountId: 'xyz567'}];
      queryMock = sinon.stub().resolves(userRecord);
      recordServiceMock = {
        upsertRecord: sinon.stub().resolves(userRecord),
        deleteRecord: sinon.stub().resolves('success')
      };
      communityUserService = communityUserServiceFactory(
        queryMock,
        recordServiceMock,
        promise,
        testLogger
      );
    });

    it('Expect queryMock called for the User', function(done) {
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(queryMock.called).to.be.true;
        expect(queryMock.calledWith('SELECT Id, AccountId FROM User WHERE Username = \'theUserName\'')).to.be.true;
        done();
      });
    });

    it('Expect recordServiceMock called for updating the User', function(done) {
      var updatedUserRecord = {
        Id: 'abc123',
        NU__ExternalId__c: 'abc123#',
        IsActive: false,
        IsPortalEnabled: false,
        Username: 'abc123@example.com',
        CommunityNickname: 'abc123@example.com',
        Email: 'abc123@example.com',
        FirstName: 'abc123',
        LastName: 'abc123'
      };
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(recordServiceMock.upsertRecord.called).to.be.true;
        expect(
          recordServiceMock.upsertRecord.calledWith('User', updatedUserRecord, 'Id')
        ).to.be.true;
        done();
      });
    });

    it('Expect recordServiceMock called for deleting the Account', function(done) {
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(recordServiceMock.deleteRecord.called).to.be.true;
        expect(recordServiceMock.deleteRecord.calledWith('Account', 'xyz567')).to.be.true;
        done();
      });
    });

    it('Expect promise rejection when queryMock rejects', function(done) {
      queryMock.reset().rejects('an error has occured');
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(true).to.be.false;
        done();
      }, function(reason) {
        expect(recordServiceMock.deleteRecord.called).to.be.false;
        expect(recordServiceMock.upsertRecord.called).to.be.false;
        expect(queryMock.called).to.be.true;
        expect(reason.message).to.contain('an error has occured');
        done();
      });
    });

    it('Expect promise rejection when recordServiceMock.upsertRecord rejects', function(done) {
      recordServiceMock.upsertRecord.reset().rejects('an error has occured');
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(true).to.be.false;
        done();
      }, function(reason) {
        expect(recordServiceMock.deleteRecord.called).to.be.false;
        expect(recordServiceMock.upsertRecord.called).to.be.true;
        expect(queryMock.called).to.be.true;
        expect(reason.message).to.be.equal('an error has occured');
        done();
      });
    });

    it('Expect promise rejection when recordServiceMock.deleteRecord rejects', function(done) {
      recordServiceMock.deleteRecord.reset().rejects('an error has occured');
      communityUserService.deleteCommunityUser('theUserName').then(function(res) {
        expect(true).to.be.false;
        done();
      }, function(reason) {
        expect(recordServiceMock.deleteRecord.called).to.be.true;
        expect(recordServiceMock.upsertRecord.called).to.be.true;
        expect(queryMock.called).to.be.true;
        expect(reason.message).to.be.equal('an error has occured');
        done();
      });
    });
  });
});
