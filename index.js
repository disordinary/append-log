"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var chunk_size = 512; //size in bytes of a chunk of db
var max_doc_size = 8; //max doc (key value pair) size of 9.99 MB
var byte_size_pad = Array(max_doc_size).fill().reduce(function (prev) {
	return prev = (prev || "") + "0";
}); //the padding string for they bytes, 8 0s

var split = require('split');

var record_seperator = String.fromCharCode(30); //record seperator ascii

var AppendLog = function () {
	function AppendLog(file, cb) {
		var _this = this;

		_classCallCheck(this, AppendLog);

		this.file = file;
		this.locked = true;
		this.write_buffer = [];
		fs.stat(file, function (err, stats) {
			if (err && err.code == 'ENOENT') {
				_this.size = 0;
			} else {
				_this.size = stats.size;
			}

			fs.open(file, 'a+', function (err, fd) {
				_this._fd = fd;
				_this.locked = false;
				cb(err, _this);
			});
		});
	}

	_createClass(AppendLog, [{
		key: "toStream",
		value: function toStream() {
			var s = fs.createReadStream(this.file); //{ fd : this._fd } doesn't work
			return s.pipe(split(record_seperator));
		}
	}, {
		key: "write",
		value: function write(output, cb) {
			this.write_buffer.push({ data: output, cb: cb });
			process.nextTick(this._write.bind(this));
		}
	}, {
		key: "_write",
		value: function _write() {
			var _this2 = this;

			if (this.locked || !this.write_buffer.length) {
				return;
			}

			this.locked = true;

			var toWrite = this.write_buffer.shift();

			var buf = new Buffer(toWrite.data + record_seperator);

			fs.write(this._fd, buf, 0, buf.byteLength, function (err) {
				_this2.size += buf.byteLength;
				toWrite.cb(err);
				_this2.locked = false;
				process.nextTick(_this2._write.bind(_this2));
			});
		}
	}, {
		key: "close",
		value: function close() {
			fs.close(this._fd);
		}
	}]);

	return AppendLog;
}();

module.exports = AppendLog;

