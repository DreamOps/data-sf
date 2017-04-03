var util = require('util');
var expect = require('chai').expect;
var namespaceServiceFactory = require('./../../src/services/namespace-service');

describe('namespace-service', function() {
  var namespaceService;
  before(function() {
    namespaceService = namespaceServiceFactory({namespaces: {
      'ZOOP__': 'FOO__',
      'ZOOP.': 'FOO.',
      'ZERP__': 'BAR__'
    }});
  });

  it('Expect all occurances of ZOOP__ namespace replaced', function() {
    var testJson = {
      'ZOOP__Product__c': {
        'RecordTypeId': '${DonationRecordType.Id}',
        'Name': 'Test Donation Product',
        'ZOOP__Entity__c': '${Entity.Id}',
        'ZOOP__DisplayOrder__c': 1,
        'ZOOP__QuantityMax__c': 1,
        'ZOOP__ListPrice__c': 10.00,
        'ZOOP__RevenueGLAccount__c': '${GlAccount.Id}',
        'ZOOP__ExternalId__c': 'TestDonationProduct'
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.FOO__Product__c).to.not.be.null;
    expect(testReturnJson.FOO__Product__c).to.not.be.undefined;
    expect(testReturnJson.FOO__Product__c.FOO__ListPrice__c)
      .to.be.equal(10.00);
    expect(testReturnJson.FOO__Product__c.FOO__QuantityMax__c)
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.FOO__DisplayOrder__c)
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });

  it('Expect all occurances of ZOOP. namespace replaced', function() {
    //fake JSON to test the ZOOP. removal
    var testJson = {
      'ZOOP__Product__c': {
        'RecordTypeId': '${DonationRecordType.Id}',
        'Name': 'Test Donation Product',
        'ZOOP__Entity__c': 'ZOOP.EntityManager.Id',
        'ZOOP.DisplayOrder__c': 1,
        'ZOOP.QuantityMax__c': 1,
        'ZOOP.ListPrice__c': 10.00,
        'ZOOP__RevenueGLAccount__c': '${GlAccount.Id}',
        'ZOOP__ExternalId__c': 'TestDonationProduct'
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.FOO__Product__c).to.not.be.null;
    expect(testReturnJson.FOO__Product__c).to.not.be.undefined;
    expect(testReturnJson.FOO__Product__c['FOO.ListPrice__c'])
      .to.be.equal(10.00);
    expect(testReturnJson.FOO__Product__c['FOO.QuantityMax__c'])
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c['FOO.DisplayOrder__c'])
      .to.be.equal(1);
    expect(testReturnJson.FOO__Product__c.FOO__Entity__c)
      .to.be.equal('FOO.EntityManager.Id');
    expect(testReturnJson.FOO__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });

  it('Expect all occurances of ZERP__ namespace replaced', function() {
    //fake data for ZERP__ removal tests
    var testJson = {
      'ZERP__Product__c': {
        'RecordTypeId': '${DonationRecordType.Id}',
        'Name': 'Test Donation Product',
        'ZERP__Entity__c': '${Entity.Id}',
        'ZERP__DisplayOrder__c': 1,
        'ZERP__QuantityMax__c': 1,
        'ZERP__ListPrice__c': 10.00,
        'ZERP__RevenueGLAccount__c': '${GlAccount.Id}',
        'ZERP__ExternalId__c': 'TestDonationProduct'
      }
    };
    var testReturnJson = namespaceService(testJson);
    expect(testReturnJson.BAR__Product__c).to.not.be.null;
    expect(testReturnJson.BAR__Product__c).to.not.be.undefined;
    expect(testReturnJson.BAR__Product__c.BAR__ListPrice__c)
      .to.be.equal(10.00);
    expect(testReturnJson.BAR__Product__c.BAR__QuantityMax__c)
      .to.be.equal(1);
    expect(testReturnJson.BAR__Product__c.BAR__DisplayOrder__c)
      .to.be.equal(1);
    expect(testReturnJson.BAR__Product__c.Name)
      .to.be.equal('Test Donation Product');
  });
});
