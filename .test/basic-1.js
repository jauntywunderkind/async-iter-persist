"use module"
import tape from "tape"
import immediate from "p-immediate"

import producer from "./fixture/producer.js"
import AsyncIterPersist from ".."

function iterate( t, iter, name, n= 4950){
	const promise= new Promise( async function( resolve){
		await immediate()
		promise.accum= 0
		promise.done= false
		for await( const val of iter){
			promise.accum+= val
			promise.done= iter.done
		}
		t.equal( promise.accum, n, `${name} accumulated`)
		t.equal( iter.done, true, `${name} done`)
		resolve( promise.accum)
	})
	return promise
}

tape( "basic tee", async function(t){

	// our fixture will be a tee on 0..99
	const
	  prod= producer( 100),
	  tee= new AsyncIterPersist( prod,{ notify: true})

	// set up a "pre" accunulator before we start iterating
	const
	  preIter= tee.tee(),
	  pre= iterate( t, preIter, "pre")
	t.equal( pre.accum, undefined, "pre has not initialized yet")
	await immediate()
	t.equal( pre.accum, 0, "pre has not run anything yet")

	// manually step our iterator
	const
	  s0= (await tee.next()).value,
	  s1= (await tee.next()).value,
	  s2= (await tee.next()).value,
	  s3= (await tee.next()).value,
	  s4= (await tee.next()).value
	t.equal( s0, 0, "manual step advances")
	t.equal( s4, 4, "manual step advances")
	t.equal( tee.state.length, 5, "manual step added to state")
	t.equal( pre.accum, 6, "pre almost accumulated")
	await immediate()
	t.equal( pre.accum, 10, "pre manually accumulated")

	// read & accumulate all remaining values now
	const accum= iterate( t, tee, "accum", 4940)
	await immediate()
	t.equal( accum.accum, 0, "accum initialized")
	const accumValue= await accum
	t.equal( accumValue, 4940, "accum value")
	t.equal( tee.done, true, "tee done")
	t.equal( tee.state.length, 100, "tee state saved")
	t.equal( pre.accum, 4950, "pre fully accumulated")

	// observe how pre terminates
	t.equal( pre.done, false, "pre not exited yet")
	let accumPreFinal= await pre
	t.equal( accumPreFinal, 4950, "pre exited")

	// iterate tee again
	const
	  postIter= tee.tee(),
	  post= iterate( t, postIter, "post"),
	  postValue= await post
	t.equal( postValue, 4950, "post value")

	// iterate pre again
	const
	  prePostIter= preIter.tee(),
	  prePost= iterate( t, prePostIter, "prePost"),
	  prePostValue= await prePost
	t.equal( prePostValue, 4950, "prePost value")

	// iterate post again
	const
	  postPostIter= postIter.tee(),
	  postPost= iterate( t, postPostIter, "postPost"),
	  postPostValue= await postPost
	t.equal( postPostValue, 4950, "postPost value")

	// check ourselves
	t.equal( pre.accum, 4950, "pre remains")
	t.equal( accum.accum, 4940, "accum remains")
	t.equal( post.accum, 4950, "post remains")
	t.equal( prePost.accum, 4950, "post remains")

	t.end()
})
