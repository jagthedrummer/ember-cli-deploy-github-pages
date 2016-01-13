/* jshint node: true */
'use strict';

var BasePlugin = require('ember-cli-deploy-plugin');
// TBD : Remove exec when we're not using it amy more. Don't forget to remove it from package.json
var exec = require('child_process').exec;
var gitty = require("gitty");

module.exports = {
  name: 'ember-cli-deploy-github-pages',

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {
        sourceBranch: 'master',
        targetBranch: 'gh-pages'
      },

      willDeploy: function(context){
        console.log('calling willDeploy');
        // here we should check to make sure all of the branches we need exist
        var repo  = (context._Git || gitty)(".");
        var plugin = this;
        return new Promise(function(resolve, reject) {
          repo.getBranches(function(error, branches){
            if(error){
              console.log(error);
              plugin.log(error,{color: 'red'});
            }else{
              console.log(branches);
              var targetBranch = plugin.readConfig('targetBranch');
              var sourceBranch = plugin.readConfig('sourceBranch');
              console.log('branches: ', targetBranch, sourceBranch);
              var sourceBranchExists = branches.indexOf(sourceBranch) >= 0;
              var targetBranchExists = branches.indexOf(targetBranch) >= 0;
              console.log('booleans', sourceBranchExists, targetBranchExists);
              if(!sourceBranchExists){
                plugin.log("Missing branch " + sourceBranch);
                console.log("Missing branch " + sourceBranch);
              }
              if(!targetBranchExists){
                plugin.log("Missing branch " + targetBranch);
                console.log("Missing branch " + targetBranch);
              }
              if(sourceBranchExists && targetBranchExists){
                return resolve();
              }else{
                return reject();
              }
            }
          });
        });
      },

      deploy: function(context) {
        var plugin = this;
        var repo  = (context._Git || gitty)(".");
        this.log("calling deploy");
        console.log("calling deploy");

        var execOptions = {};

        function checkoutGhPages() {
          return runCommand('git checkout ' + options.branch, execOptions);
        }

        function copy() {
          return runCommand('cp -R dist/* .', execOptions);
        }

        function addAndCommit() {
          return runCommand('git add . && git commit -m "' + options.message + '"', execOptions)
        }

        function returnToPreviousCheckout() {
          // Each '\' needed to be escaped here
          return runCommand("git checkout `git reflog HEAD | sed -n " +
            "'/checkout/ !d; s/.* \\(\\S*\\)$/\\1/;p' | sed '2 !d'`", execOptions);
        }

        return checkoutGhPages()
          .then(copy)
          .then(addAndCommit)
          .then(returnToPreviousCheckout)
          .then(function() {
            var branch = options.branch;
            plugin.log('Done. All that\'s left is to git push the ' + branch +
              ' branch.\nEx: git push origin ' + branch + '\n');
          });

      }
    });

    return new DeployPlugin();
  }
};

function runCommand(/* child_process.exec args */) {
  var args = Array.prototype.slice.call(arguments);

  var lastIndex = args.length - 1;
  var lastArg   = args[lastIndex];
  var logOutput = false;
  if (typeof lastArg === 'boolean') {
    logOutput = lastArg;
    args.splice(lastIndex);
  }

  console.log('calling runCommand, which should be replaced');
  return new Promise(function(resolve, reject) {
    return resolve();
    //var cb = function(err, stdout, stderr) {
      //if (logOutput) {
        //if (stderr) {
          //console.log(stderr);
        //}

        //if (stdout) {
          //console.log(stdout);
        //}
      //}

      //if (err) {
        //return reject(err);
      //}

      //return resolve();
    //};

    //args.push(cb);
    //exec.apply(exec, args);
  }.bind(this));
}
