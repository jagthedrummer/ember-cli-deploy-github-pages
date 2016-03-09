/* jshint node: true */
'use strict';

var BasePlugin = require('ember-cli-deploy-plugin');
// TBD : Remove exec when we're not using it amy more. Don't forget to remove it from package.json
var exec = require('child_process').exec;
var gitty = require("gitty");
var filesystem_extra = require('fs-extra');
var filesystem = require('fs');

console.log("setting up fs!!!!!!!!!",filesystem);

function hasBranchInRepo(branchName, branchData){
  return branchData.current === branchName || branchData.others.indexOf(branchName) >= 0;
}

module.exports = {
  name: 'ember-cli-deploy-github-pages',

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {
        sourceBranch: 'master',
        targetBranch: 'gh-pages',
        remote: 'origin'
      },

      willDeploy: function(context){
        // here we should check to make sure all of the branches we need exist
        var repo  = (context._Git || gitty)(".");
        var plugin = this;
        return new Promise(function(resolve, reject) {
          repo.getBranches(function(error, branches){
            if(error){
              plugin.log(error,{color: 'red'});
              return reject(error);
            }else{
              var targetBranch = plugin.readConfig('targetBranch');
              var sourceBranch = plugin.readConfig('sourceBranch');
              var sourceBranchExists = hasBranchInRepo(sourceBranch,branches);
              var targetBranchExists = hasBranchInRepo(targetBranch,branches)
              if(!sourceBranchExists){
                var message = "Source branch is missing. You have configured it as: " + sourceBranch + " ";
                message += "Please make sure that your configuration points to a branch that already exists, and that contains your project source."
                plugin.log(message, {color:'red'});
              }
              if(!targetBranchExists){
                var message = "Target branch is missing. You have configured it as: " + targetBranch + " ";
                message += "For help on creating a branch for deployment please see https://github.com/jagthedrummer/ember-cli-deploy-github-pages/wiki/Creating-your-gh-pages-branch";
                plugin.log(message, {color:'red'});
              }
              if(sourceBranchExists && targetBranchExists){
                return resolve();
              }else{
                return reject("One or more branches are missing");
              }
            }
          });
        });
      },

      prepare: function(context) {

        console.log("setting up fs!!!!!!!!!",filesystem);

        var plugin = this;
        var repo  = (context._Git || gitty)(".");
        var fse = context._Fse || filesystem_extra;
        var fs = context._Fs || filesystem;
        var targetBranch = this.readConfig('targetBranch');
        var remote = this.readConfig('remote');
        var distDir = context.distDir;

        console.log("setting up fs!!!!!!!!!",filesystem);

        repo.checkoutSync(targetBranch);

        var topLevelFiles = fs.readdirSync('.');
        var filesToSkip = ['.git','bower_components','node_modules','tmp'];
        for(var i = 0; i < topLevelFiles.length; i++){
          var topLevelFile = topLevelFiles[i];
          if(filesToSkip.indexOf(topLevelFile) < 0){
            console.log('removing',topLevelFile);
            fse.removeSync(topLevelFile);

          }else{
            console.log('skipping', topLevelFile);
          }
        }

        fse.copySync(distDir,'.',{clobber:true})

        repo.addSync(['.']);

        repo.commitSync('deploying with ember-cli-deploy-github-pages');
        //git commit
      },

      upload: function(context) {
        var repo  = (context._Git || gitty)(".");
        var targetBranch = this.readConfig('targetBranch');
        var remote = this.readConfig('remote');

        repo.push(remote, targetBranch, function(error, result){

        });
      },

      didUpload: function(context) {
        var repo  = (context._Git || gitty)(".");
        var sourceBranch = this.readConfig('sourceBranch');
        repo.checkoutSync(sourceBranch);
        return {};
      },

      deploy: function(context) {
        var plugin = this;
        var repo  = (context._Git || gitty)(".");
        this.log("calling deploy");

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
