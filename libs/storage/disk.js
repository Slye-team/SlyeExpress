/**
 * This code is based on
 * https://github.com/expressjs/multer/blob/master/storage/disk.js
 */

const fs        = require('fs')
const os        = require('os')
const path      = require('path')
const crypto    = require('crypto')
const mkdirp    = require('mkdirp')
const stream    = require('stream')
const mime		= require('../files/mime')

function getFilename (req, file, cb) {
	crypto.pseudoRandomBytes(16, function (err, raw) {
		cb(err, err ? undefined : raw.toString('hex'))
	})
}

function getDestination (req, file, cb) {
	cb(null, os.tmpdir())
}

function DiskStorage (opts) {
	this.getFilename = (opts.filename || getFilename)

	if (typeof opts.destination === 'string') {
		mkdirp.sync(opts.destination)
		this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
	} else {
		this.getDestination = (opts.destination || getDestination)
	}
}

DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
	let that = this

	that.getDestination(req, file, function (err, destination) {
		if (err) return cb(err)

		that.getFilename(req, file, function (err, filename) {
			if (err) return cb(err)

			let finalPath	= path.join(destination, filename)
			let outStream	= fs.createWriteStream(finalPath)
			// hex string
			let fileHead	= ''
			const fileHeadMax	= mime.maxLen * 2
			let writable = new stream.Writable({
				decodeStrings: true,
				write: function(chunk, encoding, next) {
					if(fileHead.length < fileHeadMax){
						filehead += chunk.toString('hex')
					}
					outStream.write(...arguments)
				}
			});
			filehead	= new Buffer(filehead, 'hex')

			file.stream.pipe(writable)
			outStream.on('error', cb)
			outStream.on('finish', function () {
				cb(null, {
					destination: destination,
					filename: filename,
					path: finalPath,
					size: outStream.bytesWritten,
					mimes: mime.getFileMimes(fileHead)
				})
				delete fileHead
			})
		})
	})
}

DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
	let path = file.path

	delete file.destination
	delete file.filename
	delete file.path

	fs.unlink(path, cb)
}

DiskStorage.prototype._moveFile	= function(req, file, newPath , cb){
	let p = file.path

	file.destination 	= path.dirname(newPath)
	file.filename		= path.basename(newPath)
	file.path			= newPath

	fs.rename(p, newPath)
}

module.exports = function(){
	mkdirp.sync('./.tmp')
	return new DiskStorage({
	    destination: function (req, file, cb) {
	        cb(null, './.tmp');
	    },
	    filename: function (req, file, cb) {
	        cb(null, file.fieldname + '-' + Date.now());
	    }
	})
}
