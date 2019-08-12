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

tape( "iterate then tee", async function( t){
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

tape( "tee, iterate, tee", async function( t){

	// create a "persist" instance
	const
	  f= Range( 5),
	  iter= f[ Symbol.iterator],
	  persist= new Persist( f,{ notify: true})

	// tee before reading out
	const
	  preTee= persist.tee(),
	  // read and check tee (before iterating)
	  expectPreTee= new Expect( preTee, range5),
	  expectPreTeeIter= expectPreTee[ Symbol.asyncIterator]()
	await PImmediate()
	t.equal( expectPreTeeIter.count, 0, "preTee has not progressed")

	// read out all the persist instance
	const
	  // read and check main persist
	  expectPersist= new Expect( persist, range5),
	  // this triggers expectPersist's iteration, blocking till done
	  awaitPersist= await expectPersist

	// tee again after completion
	const
	  // tee
	  postTee= persist.tee(),
	  // read and check tee (before iterating)
	  expectPostTee= new Expect( postTee, range5),
	  expectPostTeeIter= expectPostTee[ Symbol.asyncIterator]()
	// everything is set up but tee makes no progress because persist has not iterated
	await PImmediate()
	t.equal( expectPreTeeIter.count, 0, "preTee has not progressed")
	t.equal( expectPostTeeIter.count, 0, "postTee has not progressed")
	await expectPreTeeIter.drain()
	await expectPostTeeIter.drain()
	t.equal( expectPreTeeIter.count, 5, "preTee read five correct elements")
	t.equal( expectPostTeeIter.count, 5, "postTee read five correct elements")
	t.end()
})
