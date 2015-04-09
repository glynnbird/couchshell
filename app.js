#!/usr/bin/env node
var shell = require('shell');
var url = require('url');
var appsettings = { 
  cloudantdb: null,
  cloudantdbname: null
};
var completer = require('./completer.js');

if(!process.env.COUCH_URL) {
  console.log("Please specify the URL of your CouchDB instance by setting a COUCH_URL environment variable");
  process.exit();
}

// Initialization 
var app = new shell( { chdir: __dirname } )
// Middleware registration 
app.configure(function() {
  app.use(function(req, res, next){ 
    app.client = require('cloudant')(process.env.COUCH_URL);
    next()
  });
  app.use(shell.history({
    shell: app
  }));
  app.use(completer({
    shell: app,
    appsettings: appsettings
  }));
  app.use(shell.router({
    shell: app
  }));
  app.use(shell.help({
    shell: app,
    introduction: true
  }));
});


var formatErr = function(err) {
  var retval = err.status_code + ": "+ err.description + "\n";
  return retval;
}

var formatDocs = function(docs, separator) {
  var retval = []
  for (var i in docs) {
    retval.push(docs[i].id);
  }
  return retval.join(separator) + "\n";
}

// convert a database name to a URL, if it isn't already
var convertToURL = function(x) {
  var parsed = url.parse(x);
  // if it is a URL already
  if (parsed.protocol) {
    return parsed.href;
  } else {
    return process.env.COUCH_URL + "/" + encodeURIComponent(x);
  }
}

// Command registration 
app.cmd('ls', 'List dbs/documents', function(req, res, next){
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list( { limit: 10 }, function(err, data){
      if(err){ res.cyan(formatErr(err)); res.prompt(); return  }
      res.cyan(formatDocs(data.rows, ' ')||'no documents');
      res.prompt();
    });
  } else {
    app.client.db.list( function(err, data){
      if(err){ res.cyan(formatErr(err)); res.prompt(); return }
      res.cyan(data.join(' ')||'no databases');
      res.prompt();
    });
  }
});

// Command registration 
app.cmd('ll', 'List databases', function(req, res, next){
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list( { limit: 10 }, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(formatDocs(data.rows,'\n')||'no documents');
      res.prompt();
    });
  } else {
    app.client.db.list( {limit: 100}, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return }
      res.cyan(data.join('\n')||'no databases');
      res.prompt();
    });
  }
});

// Command registration 
app.cmd('cat :id', 'Print database summary or document contents', function(req, res, next){
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(JSON.stringify(data) + '\n');
      res.prompt();
    });
  } else {
    app.client.db.get(req.params.id, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return }
      res.cyan(JSON.stringify(data) + '\n');
      res.prompt();
    });
  }
});

app.cmd('ls :key', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    appsettings.cloudantdb.list( { limit: 10, startkey:req.params.key, endkey:req.params.key+'z'}, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(formatDocs(data.rows,' ')||'no documents');
      res.prompt();
    });
  } else {
    res.red("You cannot do 'ls <key>' from the top level\n");
    res.prompt();
  }
});

app.cmd('ll :key', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    appsettings.cloudantdb.list( { limit: 10, startkey:req.params.key, endkey:req.params.key+'z'}, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(formatDocs(data.rows,'\n')||'no documents');
      res.prompt();
    });
  } else {
    res.red("You cannot do 'll <key>' from the top level\n");
    res.prompt();
  }
});

app.cmd('rm :id', 'Remove a document', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    appsettings.cloudantdb.get(req.params.id, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      appsettings.cloudantdb.destroy(data._id, data._rev, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    });
  } else {
    res.red("You cannot do 'rm <id>' from the top level\n");
    res.prompt();
  }
});

app.cmd('cp :sourceid :destinationid', 'Copy a document/database', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    appsettings.cloudantdb.get(req.params.sourceid, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      data._id = req.params.destinationid;
      delete data._rev;
      appsettings.cloudantdb.insert(data, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    });
  } else {
    // when at the top level, trigger replication
    var repl = { 
                 source: convertToURL(req.params.sourceid), 
                 target: convertToURL(req.params.destinationid), 
                 create_target:true 
                };
    var r = { 
              db: '_replicator',
              body: repl,
              method: 'post'
            };
    app.client.request(r, function(err, data) {
      res.cyan("Replication scheduled:\n");
      res.cyan(JSON.stringify(data) + '\n');
      res.prompt();            
    });
  }
});

app.cmd('mkdir :db', 'Create database', function(req,res, next) {
  if (appsettings.cloudantdb) { 
    res.red("You cannot create a database inside a database!\n"); 
    res.prompt();   
  } else {
    app.client.db.create(req.params.db, function(err,data) {
      if(err){ res.red(formatErr(err)); res.prompt(); return; }
      res.cyan(JSON.stringify(data)+ '\n');
      res.prompt();
    });
  }
});

app.cmd('rmdir :db', 'Remove a database', function(req,res, next) {
  if (appsettings.cloudantdb) { 
    res.red("You cannot remove a database from here!\n"); 
    res.prompt();   
  } else {
    app.client.db.destroy(req.params.db, function(err,data) {
      if(err){ res.red(formatErr(err)); res.prompt(); return; }
      res.cyan(JSON.stringify(data)+ '\n');
      res.prompt();
    });
  }
});

app.cmd('cd ..', 'Return to home', function(req,res,next) {
  appsettings.cloudantdb = null;
  appsettings.cloudantdbname = null;
  app.set('prompt', ">> ");
  res.prompt();
});

app.cmd('cd :db', function(req,res,next) {
  app.client.db.get(req.params.db, function(err,data) {
    if(err){ res.red("Database does not exist\n"); res.prompt(); return; }
    appsettings.cloudantdb = app.client.use(req.params.db)
    appsettings.cloudantdbname = req.params.db;
    app.set('prompt', req.params.db + " >> ");
    res.prompt();
  });
});

app.cmd('echo :json > :id', 'Create a document', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    try {
      var str  = req.params.json.replace(/^'/,"").replace(/'$/,"");
      var obj = JSON.parse(str);
      obj._id = req.params.id;
      appsettings.cloudantdb.insert(obj, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    } catch(e) {
      res.red("Invalid JSON - " + req.params.json+"\n"); 
      res.prompt();   
    }
  } else {
    res.red("You cannot do 'echo :json' from the top level\n");
    res.prompt();
  }
});

app.cmd('echo :json', 'Create a document with auto-generated id', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    try {
      var str  = req.params.json.replace(/^'/,"").replace(/'$/,"");
      var obj = JSON.parse(str);
      appsettings.cloudantdb.insert(obj, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    } catch(e) {
      res.red("Invalid JSON - " + req.params.json+"\n"); 
      res.prompt();   
    }
  } else {
    res.red("You cannot do 'echo :json from the top level\n");
    res.prompt();
  }
});

app.cmd('touch :id', 'Create a new empty document, or change an existing one', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    appsettings.cloudantdb.get(req.params.id, function(err, data){
      var doc = null;
      if (err) {
        doc = { _id: req.params.id };
      } else {
        doc = data;
      }
      appsettings.cloudantdb.insert(doc, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    });
  } else {
    res.red("You cannot do 'touch :id from the top level\n");
    res.prompt();
  }
});

app.cmd('head :db', 'Show first ten documents from a database', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    res.red("You cannot do 'head :id from the top level\n");
    res.prompt();
  } else {
    var d = app.client.db.use(req.params.db);
    d.list({limit:10, include_docs:true}, function(err, data) {
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(JSON.stringify(data.rows) + '\n');
      res.prompt();
    });
  }
});

app.cmd('pwd', 'Print working directory', function(req, res, next) {
  if (appsettings.cloudantdb) { 
    res.cyan(appsettings.cloudantdbname + "\n");
    res.prompt();
  } else {
    res.cyan("/ \n");
    res.prompt();
  }
});

// Event notification 
app.on('quit', function(){
  app.client.quit();
});
