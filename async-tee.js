"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

export function AsyncIteratorTee( asyncIter, { notify= false, signal}= {}){
	const self= this instanceof AsyncIteratorTee? this: {}

	// state is the existing data that's been seen, the 'tee'
	self.state= []
	// notify is a rotating signals listeners that there is new data
	if( notify){
		self.notify= Deferrant()
	}

	// pass through iterator values
	self.value= null
	self.done= false
	// implement iterator next
	self.next= async function( arg){
		// get next value
		const next= await asyncIter.next()
		// pass through next value
		self.done= next.done
		self.value= next.value

		// append value to retained 'state'
		if( self.state){
			self.state.push( next.value)
		}

		// notify any listeners
		if( self.notify){
			const old= self.notify
			self.notify= next.done? Promise.resolve(): Deferrant()
			old.resolve( next.value)
		}
		return self
	}

	// 
	self[ Symbol.asyncIterator]= function(){
		return this
	}

	// give an iteration of existing state data to anyone who asks
	self[ Symbol.iterator]= function(...args){
		// look at retained state
		const iteration= self.state&& self.state[ Symbol.iterator]
		if( iteration){
			// & iterate through it all
			return iteration.call( self.state, ...args)
		}
	}


	// create a "fork" which reads via notify
	self.tee= function(){
		return new AsyncTeeFork(self)
	}
}
export {
  AsyncIteratorTee as default,
  AsyncIteratorTee as asyncIteratorTee
}
