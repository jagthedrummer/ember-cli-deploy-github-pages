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
var mockGetBranches = function(cb) { cb(); }
var mockGit = function() {
  return {
    createTag: mockCreateTag,
    getBranches: mockGetBranches
  };
};

describe('plugin', function() {
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
    assert.ok(plugin.deploy, 'implements the deploy hook');
  });

  describe('configure hook', function() {
    it('runs without error if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'gh-deploy'
      });

      var context = {
        ui: mockUi,
        project: stubProject,
        config: {
          "gh-deploy": {
            sourceBranch: 'master',
            targetBranch: 'gh-pages'
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // didn't throw an error
    });

    describe('without providing config', function () {
      var config, plugin, context;
      beforeEach(function() {
        config = { };
        plugin = subject.createDeployPlugin({
          name: 'gh-deploy'
        });
        context = {
          ui: mockUi,
          project: stubProject,
          config: config
        };
        plugin.beforeHook(context);
      });
      it('warns about missing optional config', function() {
        plugin.configure(context);
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing config:\s.*, using default:\s/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);
        assert.equal(messages.length, 2);
      });
      it('adds default config to the config object', function() {
        plugin.configure(context);
        assert.isDefined(config["gh-deploy"].sourceBranch);
        assert.isDefined(config["gh-deploy"].targetBranch);
      });
    });

    describe('resolving branch info from the pipeline', function() {
      it('uses the config data if it already exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'gh-deploy'
        });

        var config = {
          sourceBranch: 'some-tag',
          targetBranch: '12345'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "gh-deploy": config
          },
          commandOptions: {},
          revisionData: {
            targetBranch: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.equal(plugin.readConfig('targetBranch'), '12345');
        assert.equal(plugin.readConfig('sourceBranch'), 'some-tag');
      });

    });

    describe('willDeploy hook', function() {
      it('passes if required branches exist', function() {
        var plugin = subject.createDeployPlugin({
          name: 'gh-deploy'
        });

        mockGetBranches = function(cb) {
          var branches = ['master','gh-pages'];
          cb(null, branches);
        };

        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "gh-deploy": {},
          },
          _Git: mockGit,
          deployTarget: "development",
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isFulfilled(plugin.willDeploy(context))
          .then(function() {
            var messages = mockUi.messages.reduce(function(previous, current) {
              if (/- Missing branch:\s.*:\s/.test(current)) {
                previous.push(current);
              }

              return previous;
            }, []);
            assert.equal(messages.length, 0);
            //assert.equal(taggedWith, "deploy-development-123abc")
          })

      });

      it('fails if required branches do not exist', function() {
        var plugin = subject.createDeployPlugin({
          name: 'gh-deploy'
        });

        mockGetBranches = function(cb) {
          var branches = ['not-master','not-gh-pages'];
          cb(null, branches);
        };

        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "gh-deploy": {},
          },
          _Git: mockGit,
          deployTarget: "development",
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isFulfilled(plugin.willDeploy(context))
          .then(function() {
            var messages = mockUi.messages.reduce(function(previous, current) {
              if (/- Missing branch:\s.*:\s/.test(current)) {
                previous.push(current);
              }

              return previous;
            }, []);
            assert.equal(messages.length, 2);
            //assert.equal(taggedWith, "deploy-development-123abc")
          })

      });
    });

    describe('deploy hook', function() {
      it('does some things', function() {
        var plugin = subject.createDeployPlugin({
          name: 'gh-deploy'
        });

        var taggedWith;
        mockCreateTag = function(tag, cb) {
          taggedWith = tag;
          cb();
        };

        var config = {
          revisionKey: '123abc'
        };

        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "gh-deploy": config,
          },
          _Git: mockGit,
          deployTarget: "development",
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isFulfilled(plugin.deploy(context))
          .then(function() {
            assert.equal(taggedWith, "deploy-development-123abc")
          })
      });
    });

  });
});
