#!/usr/bin/env node
var Shell = require('shell')

var url = require('url')

var appsettings = {
  cloudantdb: null,
  cloudantdbname: null
}

var completer = require('./completer.js')

var asciitree = require('ascii-tree')

if (!process.env.COUCH_URL) {
  console.log('Please specify the URL of your CouchDB instance by setting a COUCH_URL environment variable')
  process.exit()
}

// Initialization
var iam = require('./iam.js')
var app = new Shell({ chdir: __dirname })
// Middleware registration
app.configure(function () {
  app.use(function (req, res, next) {
    iam.getToken(process.env.IAM_API_KEY).then((t) => {
      const opts = {
        url: process.env.COUCH_URL
      }
      if (t) {
        opts.defaultHeaders = { Authorization: 'Bearer ' + t }
      }
      app.client = require('nano')(opts)
      next()
    })
  })
  app.use(Shell.history({
    shell: app
  }))
  app.use(completer({
    shell: app,
    appsettings: appsettings
  }))
  app.use(Shell.router({
    shell: app
  }))
  app.use(Shell.help({
    shell: app,
    introduction: true
  }))
})

var formatErr = function (err) {
  var retval = err.status_code + ': ' + err.description + '\n'
  return retval
}

var formatDocs = function (docs, separator) {
  var retval = []
  for (var i in docs) {
    retval.push(docs[i].id)
  }
  return retval.join(separator) + '\n'
}

// convert a database name to a URL, if it isn't already
var convertToURL = function (x) {
  try {
    // if it is a URL already
    var parsed = new url.URL(x)
    return parsed.href
  } catch (error) {
    return process.env.COUCH_URL + '/' + encodeURIComponent(x)
  }
}

// Command registration
app.cmd('ls', 'List dbs/documents', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list({ limit: 10 }).then((data) => {
      res.cyan(formatDocs(data.rows, ' ') + '\n' || 'no documents')
      res.prompt()
    }).catch((err) => {
      res.cyan(formatErr(err))
      res.prompt()
    })
  } else {
    app.client.db.list().then((data) => {
      res.cyan(data.join(' ') + '\n' || 'no databases')
      res.prompt()
    }).catch((err) => {
      res.cyan(formatErr(err))
      res.prompt()
    })
  }
})

// Command registration
app.cmd('ll', 'List databases', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list({ limit: 10 }).then((data) => {
      res.cyan(formatDocs(data.rows, '\n') || 'no documents')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    app.client.db.list().then((data) => {
      res.cyan(data.join('\n') + '\n' || 'no databases')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

// Command registration
app.cmd('cat :id', 'Print database summary or document contents', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    app.client.db.get(req.params.id).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

app.cmd('ls :key', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list({ limit: 10, startkey: req.params.key, endkey: req.params.key + 'z' }).then((data) => {
      res.cyan(formatDocs(data.rows, ' ') + '\n' || 'no documents')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'ls <key>' from the top level\n")
    res.prompt()
  }
})

app.cmd('ll :key', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.list({ limit: 10, startkey: req.params.key, endkey: req.params.key + 'z' }).then((data) => {
      res.cyan(formatDocs(data.rows, '\n') || 'no documents')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'll <key>' from the top level\n")
    res.prompt()
  }
})

app.cmd('rm :id', 'Remove a document', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id).then((data) => {
      return appsettings.cloudantdb.destroy(data._id, data._rev)
    }).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'rm <id>' from the top level\n")
    res.prompt()
  }
})

app.cmd('cp :sourceid :destinationid', 'Copy a document/database', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.sourceid).then((data) => {
      data._id = req.params.destinationid
      delete data._rev
      return appsettings.cloudantdb.insert(data)
    }).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    // when at the top level, trigger replication
    var startedtimeout = setTimeout(() => {
      res.cyan('Replication scheduled:\n')
      res.cyan(req.params.sourceid + ' > ' + req.params.destinationid + '\n')
      res.prompt()
    }, 3000);

    app.client.db.replicate(
      req.params.sourceid,
      req.params.destinationid,
      { create_target:true }
    ).catch((err) => {
      clearTimeout(startedtimeout);
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

app.cmd('mkdir :db', 'Create database', function (req, res, next) {
  if (appsettings.cloudantdb) {
    res.red('You cannot create a database inside a database!\n')
    res.prompt()
  } else {
    app.client.db.create(req.params.db).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

app.cmd('rmdir :db', 'Remove a database', function (req, res, next) {
  if (appsettings.cloudantdb) {
    res.red('You cannot remove a database from here!\n')
    res.prompt()
  } else {
    app.client.db.destroy(req.params.db).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

app.cmd('cd ..', 'Return to home', function (req, res, next) {
  appsettings.cloudantdb = null
  appsettings.cloudantdbname = null
  app.set('prompt', '>> ')
  res.prompt()
})

app.cmd('cd :db', function (req, res, next) {
  app.client.db.get(req.params.db).then((data) => {
    appsettings.cloudantdb = app.client.use(req.params.db)
    appsettings.cloudantdbname = req.params.db
    app.set('prompt', req.params.db + ' >> ')
    res.prompt()
  }).catch((err) => {
    res.red('Database does not exist\n')
    res.red(formatErr(err))
    res.prompt()
  })
})

app.cmd('echo :json > :id', 'Create a document', function (req, res, next) {
  if (appsettings.cloudantdb) {
    try {
      var str = req.params.json.replace(/^'/, '').replace(/'$/, '')
      var obj = JSON.parse(str)
      obj._id = req.params.id
      appsettings.cloudantdb.insert(obj).then((data) => {
        res.cyan(JSON.stringify(data) + '\n')
        res.prompt()
      }).catch((err) => {
        res.red(formatErr(err))
        res.prompt()
      })
    } catch (e) {
      res.red('Invalid JSON - ' + req.params.json + '\n')
      res.prompt()
    }
  } else {
    res.red("You cannot do 'echo :json' from the top level\n")
    res.prompt()
  }
})

app.cmd('echo :json', 'Create a document with auto-generated id', function (req, res, next) {
  if (appsettings.cloudantdb) {
    try {
      var str = req.params.json.replace(/^'/, '').replace(/'$/, '')
      var obj = JSON.parse(str)
      appsettings.cloudantdb.insert(obj).then((data) => {
        res.cyan(JSON.stringify(data) + '\n')
        res.prompt()
      }).catch((err) => {
        res.red(formatErr(err))
        res.prompt()
      })
    } catch (e) {
      res.red('Invalid JSON - ' + req.params.json + '\n')
      res.prompt()
    }
  } else {
    res.red("You cannot do 'echo :json from the top level\n")
    res.prompt()
  }
})

app.cmd('touch :id', 'Create a new empty document, or change an existing one', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id).then((data) => {
      return appsettings.cloudantdb.insert(data)
    }).catch((err) => {
      if (err.statusCode === 404) {
        const doc = { _id: req.params.id }
        return appsettings.cloudantdb.insert(doc)
      }
    }).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'touch :id from the top level\n")
    res.prompt()
  }
})

app.cmd('tree :id', 'View the revision history of a document', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id, { conflicts: true, revs_info: true }).then((data) => {
      var revs = []
      let i
      for (i in data._revs_info) {
        revs.push(data._revs_info[i].rev)
      }
      for (i in data._conflicts) {
        revs.push(data._conflicts[i])
      }
      revs = revs.sort()
      var revslist = { }
      for (i in revs) {
        var match = revs[i].match(/^[0-9]+/)
        if (match) {
          var rev = match[0]
          if (!revslist[rev]) {
            revslist[rev] = []
          }
          revslist[rev].push(revs[i])
        }
      }
      var output = '#id = ' + req.params.id + '\n'
      for (i in revslist) {
        var prefix = '##'
        if (revslist[i].length === 1) {
          output += prefix + revslist[i][0]
          if (revslist[i][0] === data._rev) {
            output += ' *'
          }
          output += '\n'
        } else {
          output += prefix + revslist[i][0].match(/^[0-9]+/)[0]
          output += '\n'
          prefix += '#'
          for (var j in revslist[i]) {
            output += prefix + revslist[i][j]
            if (revslist[i][j] === data._rev) {
              output += ' *'
            }
            output += '\n'
          }
        }
      }
      res.cyan(asciitree.generate(output) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'tree :id from the top level\n")
    res.prompt()
  }
})

app.cmd('head :db', 'Show first ten documents from a database', function (req, res, next) {
  if (appsettings.cloudantdb) {
    res.red("You cannot do 'head :id from the db level\n")
    res.prompt()
  } else {
    var d = app.client.db.use(req.params.db)
    d.list({ limit: 10, include_docs: true }).then((data) => {
      res.cyan(JSON.stringify(data.rows) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  }
})

app.cmd('pwd', 'Print working directory', function (req, res, next) {
  if (appsettings.cloudantdb) {
    res.cyan(appsettings.cloudantdbname + '\n')
    res.prompt()
  } else {
    res.cyan('/ \n')
    res.prompt()
  }
})

app.cmd('du :db', 'Disk usage of a database', function (req, res, next) {
  app.client.db.get(req.params.db).then((data) => {
    res.cyan(JSON.stringify(data) + '\n')
    res.prompt()
  }).catch((err) => {
    res.red(formatErr(err))
    res.prompt()
  })
})

app.cmd('du', 'Disk usage of a database', function (req, res, next) {
  if (appsettings.cloudantdb) {
    app.client.db.get(appsettings.cloudantdbname).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'du' from the top level. Try 'du <dbname>'\n")
    res.prompt()
  }
})

app.cmd('fsck :id :rev', 'Repair document (remove conflicts) by defining a winning revision', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id, { conflicts: true, revs_info: true }).then((data) => {
      if (!data._conflicts) {
        res.red('No conflicts found.\n')
        res.prompt()
        return
      }

      // check that the proposed winner is one of the existing conflicts
      if (data._conflicts.indexOf(req.params.rev) === -1) {
        res.red('The revision ' + req.params.rev + ' does not exist in the document.\n')
        res.prompt()
        return
      }

      // delete all conflics, leaving the nominated revision as the uncontested winner
      var deletions = []
      for (var i in data._conflicts) {
        if (data._conflicts[i] !== req.params.rev) {
          deletions.push({ _id: req.params.id, _rev: data._conflicts[i], _deleted: true })
        }
      }

      // delete the current winner if required
      if (data._rev !== req.params.rev) {
        deletions.push({ _id: req.params.id, _rev: data._rev, _deleted: true })
      }

      // perform bulk operation
      return appsettings.cloudantdb.bulk({ docs: deletions })
    }).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'fsck :id' from the top level.\n")
    res.prompt()
  }
})

app.cmd('fsck :id', 'Repair document (remove conflicts)', function (req, res, next) {
  if (appsettings.cloudantdb) {
    appsettings.cloudantdb.get(req.params.id, { conflicts: true, revs_info: true }).then((data) => {
      if (!data._conflicts) {
        res.red('No conflicts found.\n')
        res.prompt()
        return
      }
      // delete all conflics, leaving the winning revision as the uncontested winner
      var deletions = []
      for (var i in data._conflicts) {
        deletions.push({ _id: req.params.id, _rev: data._conflicts[i], _deleted: true })
      }
      return appsettings.cloudantdb.bulk({ docs: deletions })
    }).then((data) => {
      res.cyan(JSON.stringify(data) + '\n')
      res.prompt()
    }).catch((err) => {
      res.red(formatErr(err))
      res.prompt()
    })
  } else {
    res.red("You cannot do 'fsck :id' from the top level.\n")
    res.prompt()
  }
})

// Event notification
app.on('quit', function () {
  process.exit()
})
