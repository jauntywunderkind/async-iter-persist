"use module"
import Range from "async-iter-range/immediate.js"
import tape from "tape"
import Persist from ".."

tape( "mark sweep", async function( t){
	const p= new Persist( Range( 5))
	
	t.end()
})

