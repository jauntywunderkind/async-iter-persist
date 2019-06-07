"use module"
import tape from "tape"
import readRolling from "async-iter-read/rolling.js"
//import readFixed from "async-iter-read/fixed.js"
//import readForAwait from "async-iter-read/for-await.js"

import ReferenceUnique from "../reference.js"

import { fixture, a, b, c} from "./fixture.js"


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
	
