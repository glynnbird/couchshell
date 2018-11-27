'use strict'

// find the longest common prefix in a list of strings
module.exports = function longestCommonPrefix (strings) {
  if (!strings.length) {
    return ''
  }

  var candidate = strings[0]
  for (var i = 1; i < strings.length; i++) {
    var str = strings[i]
    while (str.indexOf(candidate) !== 0 && candidate) {
      candidate = candidate.substring(0, candidate.length - 1)
    }
    if (!candidate) {
      break
    }
  }
  return candidate
}
