/* jshint node: true */

'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var assert  = require('ember-cli/tests/helpers/assert');

var stubProject = {
  name: function(){
    return 'my-project';
  }
};

var mockCreateTag = function(tag, cb) { cb(); }
var mockGit = function() {
  return {
    createTag: mockCreateTag
  };
};

describe('redis plugin', function() {
  var subject, mockUi;

  beforeEach(function() {
    subject = require('../../index');
    mockUi = {
      verbose: true,
      messages: [],
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(result.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });
    assert.ok(plugin.didDeploy);
  });

  describe('configure hook', function() {
    it('runs without error if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'tag-git'
      });

      var context = {
        ui: mockUi,
        project: stubProject,
        config: {
          "tag-git": {
            app: 'some-app',
            token: 'super-secret-token'
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // didn't throw an error
    });

    describe('resolving revisionKey from the pipeline', function() {
      it('uses the config data if it already exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });

        var config = {
          deployTag: 'some-tag',
          revisionKey: '12345'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "tag-git": config
          },
          commandOptions: {},
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.equal(plugin.readConfig('revisionKey'), '12345');
        assert.equal(plugin.readConfig('deployTag'), 'some-tag');
      });

    });

  });
});
