"use module"
import Range from "async-iter-range/immediate.js"
import Expect from "async-iter-expect"
import readRolling from "async-iter-read/rolling.js"
import PImmediate from "p-immediate"
import tape from "tape"
import Persist from ".."

const range5= [ 0, 1, 2, 3, 4]

// TODO: alternatives that use readrolling

tape( "tee before iterating", async function( t){
	// create persist, tee, and start reading/verifying (expect) from tee
	const
	  // create a "persist" instance
	  f= Range( 5),
	  iter= f[ Symbol.iterator],
	  persist= new Persist( f,{ notify: true}),
	  // tee
	  tee= persist.tee(),
	  // read and check tee (before iterating)
	  expectTee= new Expect( tee, range5),
	  expectTeeIter= expectTee[ Symbol.asyncIterator]()
	// everything is set up but tee makes no progress because persist has not iterated
	await PImmediate() // maybe wait longer?
	t.equal( expectTeeIter.count, 0, "tee has not progressed")

	// start reading in on persist, which will also flow to tee
	const
	  // read and check main persist
	  expectPersist= new Expect( persist, range5),
	  // this triggers expectPersist's iteration
	  awaitPersist= await expectPersist,
	  // now expectTee can be read from too
	  awaitTee= await expectTeeIter.drain()

	t.equal( awaitTee.count, 5, "read five correct elements")
	t.end()
})

tape( "postfork", async function( t){
	// create a "persist" instance
	const
	  f= Range( 5),
	  iter= f[ Symbol.iterator],
	  persist= new Persist( f,{ notify: true})
	// read out all the persist instance
	const
	  // read and check main persist
	  expectPersist= new Expect( persist, range5),
	  // this triggers expectPersist's iteration
	  awaitPersist= await expectPersist

	// verify we can still tee & read out the tee
	const
	  // tee
	  tee= persist.tee(),
	  // read and check tee (before iterating)
	  expectTee= new Expect( tee, range5),
	  expectTeeIter= expectTee[ Symbol.asyncIterator]()
	// everything is set up but tee makes no progress because persist has not iterated
	await PImmediate()
	t.equal( expectTeeIter.count, 0, "tee has not progressed")
	await expectTeeIter.drain()
	t.equal( expectTeeIter.count, 5, "read five correct elements")
	t.end()
})

tape( "both", async function( t){
	t.end()
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
	
