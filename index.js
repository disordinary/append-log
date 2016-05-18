var fs = require('fs');
const chunk_size = 512; //size in bytes of a chunk of db
const max_doc_size = 8; //max doc (key value pair) size of 9.99 MB
const byte_size_pad = Array(max_doc_size).fill().reduce(prev => prev = (prev || "") + "0"); //the padding string for they bytes, 8 0s

var split = require('split');

const record_seperator = String.fromCharCode(30); //record seperator ascii

class AppendLog {
	constructor(file, cb) {
		this.file = file;
		this.locked = true;
		this.write_buffer = [];
		fs.stat(file, (err, stats) => {
			if (err && err.code == 'ENOENT') {
				this.size = 0;
			} else {
				this.size = stats.size;
			}

			fs.open(file, 'a+', (err, fd) => {
				this._fd = fd;
				this.locked = false;
				cb(err, this);
			});
		});
	}

	readStream() {
		var s = fs.createReadStream(this.file); //{ fd : this._fd } doesn't work
		return s.pipe(split(record_seperator));
	}

	write(output, cb) {
		this.write_buffer.push({ data: output, cb: cb });
		process.nextTick(this._write.bind(this));
	}

	_write() {
		if (this.locked || !this.write_buffer.length) {
			return;
		}

		this.locked = true;

		let toWrite = this.write_buffer.shift();

		let buf = new Buffer(toWrite.data + record_seperator);

		fs.write(this._fd, buf, 0, buf.byteLength, err => {
			this.size += buf.byteLength;
			toWrite.cb(err);
			this.locked = false;
			process.nextTick(this._write.bind(this));
		});
	}
}

module.exports = AppendLog;

