"use module"
import tape from "tape"

import producer from "./fixture/producer.js"
import AsyncTee from ".."

tape( "basic tee", async function(t){
	const
	  prod= producer( 100),
	  tee1= new AsyncTee( prod,{ notify: true})
	for await( const val of tee1){
		console.log( val)
	}
	console.log()
	const tee2= tee1.tee()
	for await( const val of tee2){
		console.log( val)
	}
})
