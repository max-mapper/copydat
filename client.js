var increment = require('increment-buffer')
var sodium = require('sodium-native')
var varint = require('varint')
var crypto = require('crypto')
var net = require('net')
var fs = require('fs')
var through = require('through2')
var lps = require('length-prefixed-stream')
var lpm = require('length-prefixed-message')
var swarm = require('discovery-swarm')
var defaults = require('datland-swarm-defaults')
var pump = require('pump')
var tar = require('tar-fs')

module.exports = function (key, out) {
  if (typeof key === 'string') key = new Buffer(key, 'hex')
  var sw = swarm(defaults({dht: false}))
  var discovery = crypto.createHmac('sha256', 'tardat').update(key).digest()
  sw.join(discovery)
  sw.on('connection', onSocket)

  function onSocket (sock) {
    console.log('on socket')
    lpm.read(sock, function (nonce) {
      var decode = lps.decode()
      var decrypt = through(function (obj, enc, next) {
        var macStart = obj.length - sodium.crypto_secretbox_MACBYTES
        var mac = obj.slice(macStart)
        var data = obj.slice(0, macStart)
        var result = sodium.crypto_secretbox_open_detached(data, data, mac, nonce, key) // in place decryption
        increment(nonce) // security
        if (!result) return next(new Error('the gibson was hacked'))
        next(null, data)
      })
      
      var write = tar.extract(out)
      
      pump(sock, decode, decrypt, through(function (obj, enc, next) {
        console.log(obj.length)
        next(null, obj)
      }), write, function (err) {
        if (err) throw err
        console.log('Done')
        sw.destroy()
      })
    })    
  }

}