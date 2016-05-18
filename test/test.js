var AppendLog = require('../index.js');

var assert = require("assert");

function runByOne(generatorFunction) {
    var generatorItr = generatorFunction(resume);
    function resume( err ) {
        generatorItr.next(  err  );
    }
    generatorItr.next()
}


describe( "The append log returns records in the same order as inserted." , ( ) => {
	it( "an insert should be the same as a retrieval" , ( done ) => {
		var appendLog = new AppendLog('./test.log' , ( err , log ) => {
			let tests = [ "TEST" , "TEST1" , "TEST2" , "FOO" , "BAH" , "BAZ" ];
			let test_return = [ ];
			runByOne(function* myDelayedMessages(next) {
				for( test of tests ) {
					yield log.write( test , next );
				}
				
				var read = log.readStream();
				read.on('data' , ( chunk ) => {
					if( chunk ) {
						test_return.push( chunk );
					}
				});

				read.on('end' , ( ) => {
					assert.deepEqual( tests , test_return );
					require('fs').unlink('./test.log');
					done( );
				});
			});

		});
	});
});

/*describe( "Multiple simultaneous inserts should be buffered and inserted." , ( ) => {
	it( "multiple inserts should work" , ( done ) => {
		var appendLog = new AppendLog('./test.log' , ( err , log ) => {
			let tests = [ "TEST" , "TEST1" , "TEST2" , "FOO" , "BAH" , "BAZ" ];
			let test_return = [ ];
			
				for( test of tests ) {
					log.write( test , () => {} );
				}
				
				
			

		});
	});
});*/