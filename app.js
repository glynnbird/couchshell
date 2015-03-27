var shell = require('shell');
var cloudantdb = null;

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
    app.db = null;
    next()
  });
  app.use(shell.history({
    shell: app
  }));
  app.use(shell.completer({
    shell: app
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
// Command registration 
app.cmd('ls', 'List dbs/documents', function(req, res, next){
  if (cloudantdb) {
    cloudantdb.list( { limit: 10 }, function(err, data){
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
  if (cloudantdb) {
    cloudantdb.list( { limit: 10 }, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      res.cyan(formatDocs(data.rows,'\n')||'no documents');
      res.prompt();
    });
  } else {
    app.client.db.list( function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return }
      res.cyan(data.join('\n')||'no databases');
      res.prompt();
    });
  }
});

// Command registration 
app.cmd('cat :id', 'Print database summary or document contents', function(req, res, next){
  if (cloudantdb) {
    cloudantdb.get(req.params.id, function(err, data){
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
  if (cloudantdb) { 
    cloudantdb.list( { limit: 10, startkey:req.params.key, endkey:req.params.key+'z'}, function(err, data){
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
  if (cloudantdb) { 
    cloudantdb.list( { limit: 10, startkey:req.params.key, endkey:req.params.key+'z'}, function(err, data){
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
  if (cloudantdb) { 
    cloudantdb.get(req.params.id, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      cloudantdb.destroy(data._id, data._rev, function(err, data) {
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

app.cmd('cp :sourceid :destinationid', 'Copy a document', function(req, res, next) {
  if (cloudantdb) { 
    cloudantdb.get(req.params.sourceid, function(err, data){
      if(err){ res.red(formatErr(err)); res.prompt(); return  }
      data._id = req.params.destinationid;
      delete data._rev;
      cloudantdb.insert(data, function(err, data) {
        if(err){ res.red(formatErr(err)); res.prompt(); return  }
        res.cyan(JSON.stringify(data) + '\n');
        res.prompt();
      });
    });
  } else {
    res.red("You cannot do 'cp <sourceid> <destinationid>' from the top level\n");
    res.prompt();
  }
});

app.cmd('mkdir :db', 'Create database', function(req,res, next) {
  if (cloudantdb) { 
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
  if (cloudantdb) { 
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
  cloudantdb = null;
  app.set('prompt', ">> ");
  res.prompt();
});

app.cmd('cd :db', function(req,res,next) {
  cloudantdb = app.client.use(req.params.db)
  app.set('prompt', req.params.db + " >> ");
  res.prompt();
});

app.cmd('echo :json > :id', 'Create a document', function(req, res, next) {
  if (cloudantdb) { 
    try {
      var str  = req.params.json.replace(/^'/,"").replace(/'$/,"");
      var obj = JSON.parse(str);
      obj._id = req.params.id;
      cloudantdb.insert(obj, function(err, data) {
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
  if (cloudantdb) { 
    try {
      var str  = req.params.json.replace(/^'/,"").replace(/'$/,"");
      var obj = JSON.parse(str);
      cloudantdb.insert(obj, function(err, data) {
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

// Event notification 
app.on('quit', function(){
  app.client.quit();
});