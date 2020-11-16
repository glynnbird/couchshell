'use strict'

// find the longest common prefix in a list of strings
module.exports = function longestCommonPrefix (strings) {
  if (!strings.length) {
    return ''
  }

  let candidate = strings[0]
  for (let i = 1; i < strings.length; i++) {
    const str = strings[i]
    while (str.indexOf(candidate) !== 0 && candidate) {
      candidate = candidate.substring(0, candidate.length - 1)
    }
    if (!candidate) {
      break
    }
  }
  return candidate
}
