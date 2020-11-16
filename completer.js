
/*
###
Completer plugin
================
Provides tab completion. Options passed during creation are:
-   `shell`  , (required) A reference to your shell application.
###
module.exports = (settings) ->
  # Validation
  throw new Error 'No shell provided' if not settings.shell
  shell = settings.shell
  # Plug completer to interface
  return unless shell.isShell
  shell.interface().completer = (text, cb) ->
    suggestions = []
    routes = shell.routes
    for route in routes
      command = route.command
      if command.substr(0, text.length) is text
        suggestions.push command
    cb(false, [suggestions, text])
  null
*/

const longestCommonPrefix = require('./longest-common-prefix')
const nano = require('nano')

function processSuggestions (suggestions, startkey, text, cb) {
  if (suggestions.length) {
    const prefix = longestCommonPrefix(suggestions).substring(startkey.length)

    if (prefix.length) { // one common prefix, so complete it
      suggestions = [text + prefix]
    }
  }
  cb(null, [suggestions, text])
}

module.exports = function (settings) {
  if (!settings.shell) {
    throw new Error('No shell provided')
  }
  if (!settings.appsettings) {
    throw new Error('No appsettings provided')
  }
  const shell = settings.shell
  const appsettings = settings.appsettings
  if (!shell.isShell) {
    return
  }
  shell.interface().completer = function (text, cb) {
    // first let's see if the command has spaces in
    const bits = text.split(' ')

    // if we have no space, then we haven't finished typing the command - so we want command auto-completion
    if (bits.length === 1) {
      const suggestions = []
      const routes = shell.routes
      for (const i in routes) {
        const command = routes[i].command
        if (command.substr(0, text.length) === text) {
          suggestions.push(command)
        }
      }
      cb(null, [suggestions, text])
    } else {
      // if we are in a sub-directory, we want documentid auto-completion
      let startkey
      if (appsettings.cloudantdb) {
        startkey = bits[bits.length - 1] || ''
        appsettings.cloudantdb.list({
          limit: 10,
          startkey: startkey,
          endkey: startkey + '\uffff'
        }, function (err, data) {
          if (err) {
            // handle error
          }
          const suggestions = data.rows.map(function (row) {
            return row.id
          })
          processSuggestions(suggestions, startkey, text, cb)
        })
      } else {
        // database/documentid autocompletion
        startkey = bits[bits.length - 1] || ''
        nano(process.env.COUCH_URL).relax({
          db: '_all_dbs'
        }, function (err, data) {
          if (err) {
            // handle error
          }
          const suggestions = data.filter(function (db) {
            return db.indexOf(startkey) === 0
          })
          processSuggestions(suggestions, startkey, text, cb)
        })
      }
    }
  }
}
