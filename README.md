# append_log
append only log for todb

It has two methods, `add` and `readStream`. ReadStream returns a stream of the entire log file.

```javascript
	var appendLog = new AppendLog('./test.log' , ( err , log ) => {
		log.write( "value" , ( err ) => {
			log.readStream.pipe(process.stdout);
		})
	});

```