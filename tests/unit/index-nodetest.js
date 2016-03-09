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
var mockCheckout = function(branch) { }
var mockAdd = function(files) { }
var mockPush = function(remote, branch, cb) { cb(); }
var mockGetBranches = function(cb) { cb(); }
var mockCommit = function(message) {}
var mockGit = function() {
  return {
    createTag: mockCreateTag,
    getBranches: mockGetBranches,
    checkoutSync: mockCheckout,
    addSync: mockAdd,
    commitSync: mockCommit,
    push: mockPush
  };
};

describe('plugin', function() {
  var subject, mockUi, context, plugin;

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
    context = {
      _Git: mockGit,
      ui: mockUi,
      project: stubProject,
      config: {
        "gh-deploy": {
          sourceBranch: 'master',
          targetBranch: 'gh-pages'
        }
      },
      distDir: 'tmp/deploy-dist'
    };
    plugin = subject.createDeployPlugin({
      name: 'gh-deploy'
    });
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
    assert.ok(plugin.willDeploy, 'implements the willDeploy hook');
    assert.ok(plugin.prepare, 'implements the prepare hook');
    assert.ok(plugin.upload, 'implements the upload hook');
    assert.ok(plugin.didUpload, 'implements the didUpload hook');
  });

  describe('configure hook', function() {
    it('runs without error if config is ok', function() {
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // didn't throw an error
    });

    describe('without providing config', function () {
      beforeEach(function() {
        context.config["gh-deploy"] = {}
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
        assert.equal(messages.length, 3);
      });
      it('adds default config to the config object', function() {
        plugin.configure(context);
        assert.isDefined(context.config["gh-deploy"].sourceBranch);
        assert.isDefined(context.config["gh-deploy"].targetBranch);
      });
    });

    describe('resolving branch info from the pipeline', function() {
      it('uses the config data if it already exists', function() {
        var newConfig = {
          sourceBranch: 'some-tag',
          targetBranch: '12345'
        };
        context.config["gh-deploy"] = newConfig;

        plugin.beforeHook(context);
        plugin.configure(context);

        assert.equal(plugin.readConfig('targetBranch'), '12345');
        assert.equal(plugin.readConfig('sourceBranch'), 'some-tag');
      });
    });
  }); /* configure hook */

  describe('willDeploy hook', function() {
    it('passes if required branches exist', function() {

      mockGetBranches = function(cb) {
        var branches = { current: 'master', others: ['gh-pages'] }
        cb(null, branches);
      };

      plugin.beforeHook(context);
      plugin.configure(context);

      return assert.isFulfilled(plugin.willDeploy(context))
        .then(function() {
          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- Missing branch\s.*/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);
          assert.equal(messages.length, 0);
        });
    });

    it('fails if required branches do not exist', function() {

      mockGetBranches = function(cb) {
        var branches = { current: 'not-master', others: [] };
        cb(null, branches);
      };

      plugin.beforeHook(context);
      plugin.configure(context);

      return assert.isRejected(plugin.willDeploy(context))
        .then(function() {
          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/.*branch is missing.*/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);
          assert.equal(messages.length, 2);
          //assert.equal(taggedWith, "deploy-development-123abc")
        })
    });
  });

  describe('prepare hook', function() {
    it('checks out the target branch, copies files, adds and commits',function(){
      var checkedOutBranch;
      mockCheckout = function(branch){
        checkedOutBranch = branch;
      };

      var addedFiles;
      mockAdd = function(files){
        addedFiles = files;
      };

      var copiedFrom, copiedTo;
      var mockFse = {
        copySync: function(from, to){
          copiedFrom = from;
          copiedTo = to;
        }
      };

      var commitMessage;
      mockCommit = function(message){
        commitMessage = message;
      }


      context._Fse = mockFse;

      plugin.beforeHook(context);
      plugin.configure(context);

      plugin.prepare(context);

      assert.equal(checkedOutBranch, "gh-pages");
      assert.equal(copiedFrom,'tmp/deploy-dist');
      assert.equal(copiedTo,'.');
      assert.equal(addedFiles[0], ".");
      assert.ok(commitMessage);
    });
  });

  describe('upload hook', function() {
    it('pushes to the remote', function() {
      var pushedRemote, pushedBranch;
      mockPush = function(remote, branch){
        pushedRemote = remote;
        pushedBranch = branch;
      };

      plugin.beforeHook(context);
      plugin.configure(context);

      plugin.upload(context);

      assert.equal(pushedRemote, "origin");
      assert.equal(pushedBranch, "gh-pages");
    });
  });


  describe('didUpload hook', function() {
    it('checks out the source branch',function(){

      var checkedOutBranch;
      mockCheckout = function(branch){
        checkedOutBranch = branch;
      };

      plugin.beforeHook(context);
      plugin.configure(context);

      plugin.didUpload(context);

      assert.equal(checkedOutBranch, "master");
    });
  });


  /*
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
  */
});
