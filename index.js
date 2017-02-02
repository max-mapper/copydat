var increment = require('increment-buffer')
var sodium = require('sodium-native')
var varint = require('varint')
var crypto = require('crypto')
var net = require('net')
var fs = require('fs')
var swarm = require('discovery-swarm')
var defaults = require('datland-swarm-defaults')
var through = require('through2')
var pump = require('pump')
var tar = require('tar-fs')

module.exports = function (key, dir) { // symmetric key
  if (typeof key === 'string') key = new Buffer(key, 'hex')
  var sw = swarm(defaults({dht: false}))
  var discovery = crypto.createHmac('sha256', 'tardat').update(key).digest()
  sw.join(discovery)
  sw.on('connection', onSocket)

  function onSocket (sock) {
    var nonce = crypto.randomBytes(sodium.crypto_secretbox_NONCEBYTES)
    sock.write(num2varint(nonce.length))
    sock.write(nonce)
    var rs = tar.pack(dir)

    var encrypt = through(function (obj, enc, next) {
      var mac = new Buffer(sodium.crypto_secretbox_MACBYTES)
      var lenint = num2varint(obj.length + mac.length)
      var newBuf = new Buffer(obj.length) // causes tar header corruption if not used???
      sodium.crypto_secretbox_detached(newBuf, mac, obj, nonce, key) // in place encryption
      increment(nonce) // security
      this.push(lenint)
      this.push(newBuf)
      this.push(mac)
      next()
    })
    pump(rs, encrypt, sock, function (err) {
      if (err) return console.error(err)
      console.log('Done')
      sw.destroy()
    })
  }
  
  function num2varint (num) {
    var buf = new Buffer(varint.encodingLength(num))
    return varint.encode(num, buf)
  }
}