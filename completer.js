
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
    
module.exports = function(settings) {
  if (!settings.shell) {
    throw new Error("No shell provided");
  } 
  if (!settings.appsettings) {
    throw new Error("No appsettings provided");
  } 
  var shell = settings.shell;
  var appsettings = settings.appsettings;
  if (!shell.isShell) {
    return;
  }       
  shell.interface().completer = function(text, cb) {
   
   // first let's see if the command has spaces in
    var bits = text.split(" "); 
    
    // if we have no space, then we haven't finished typing the command - so we want command auto-completion
    if (bits.length==1) {
      var suggestions = []
      var routes = shell.routes
      for (var i in routes) {
        var command = routes[i].command;
        if (command.substr(0, text.length) ==  text) {
          suggestions.push(command);
        }
      }
      cb(false, [suggestions, text])
    } else {
      
      // if we are in a sub-directory, we want documentid auto-completion
      if (appsettings.cloudantdb) {
        var startkey = bits.pop();
        appsettings.cloudantdb.list( { limit: 10, startkey:startkey, endkey:startkey+'z'}, function(err, data){
          // console.log("AC2", JSON.stringify(appsettings));
          var suggestions = [];
          for(var i in data.rows) {
            suggestions.push(data.rows[i].id);
          }
          if(suggestions.length==1) {
            bits.push(suggestions[0]);
            text = bits.join(" ");
            suggestions=true;
         //   console.log(text);
          }
          cb(false, [ suggestions, text]);
        });

      } else {
        
        cb(false, [ [] , text]);

      }
      // database/documentid autocompletion
      
      
      
    }

  };
};