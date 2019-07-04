"use module"
import tape from "tape"
import readRolling from "async-iter-read/rolling.js"
import readExpect from "async-iter-read/expect.js"

import { Fixture, a, b, c} from "./fixture.js"

tape( "prefork", function( t){
	const
	  f= Fixture(),
	  iter= f[ Symbol.iterator],
	  persist= Persist( f,{ notify: true}),
	  prefork= persist.tee(),
	  readPrefork= readRolling( prefork, 3),
	  expectPrefork= Expect( readPrefork, expected)

})

tape( "postfork", function( t){
})

tape( "reference deduplicate", async function( t){
	const f= fixture()

	const
	  // start an iteration to read all data, ahead of our main read
	  preForkAhead= readFixed( refUnique.tee(), 8),
	  preForkAll= readForAwait( refUnique.tee()),
	  // read all elements in the main
	  read= readForAwait( refUnique),
	  // start an iteration after the fact
	  postForkAhead= readFixed( refUnique.tee(), 8),
	  postForkAll= readForAwait( refUnique.tee())

	const
	  // wait for main read to finish
	  doneRead= await read,
	  // start another read
	  postReadForkAhead= readFixed( refUnique.tee(), 8),
	  postReadForkAll= readForAwait( refUnique.tee()),
	  // wait for iterations to finish
	  donePreForkAhead= await preForkAhead,
	  donePreForkAll= await preForkAll,
	  donePostForkAhead= await postForkAhead,
	  donePostForkAll= await postForkAll,
	  donePostReadForkAhead= await postReadForkAhead,
	  donePostReadForkAll= await postReadForkAll

	console.log({ doneRead, donePreForkAhead, donePreForkAll, donePostForkAhead, donePostForkAll, donePostReadForkAhead, donePostForkAll})
	t.end()
})
	
