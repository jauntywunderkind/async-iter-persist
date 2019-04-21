"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

let forkId= 0

export class AsyncIteratorTee{
	constructor( asyncIter,{ notify= false, signal}= {}){
		// underlying iterator that we are "tee"'ing
		this.asyncIter= asyncIter

		// state is the existing data that's been seen, the 'tee'
		this.state= []
		this.returnValue= undefined
		// notify is a rotating signals listeners that there is new data
		if( notify){
			this.notify= Deferrant()
		}

		// pass through iterator values
		this.value= null
		this.done= false
		return this
	}

	// implement iterator next
	async next( arg){
		// get next value
		const next= await this.asyncIter.next()
		// pass through next value
		this.done= next.done
		this.value= next.value

		if( next.done){
			// append value to retained 'state'
			this.returnValue= next.value
		}else if( this.state){
			// enqueue normal values
			this.state.push( next.value)
		}

		// notify any listeners
		if( this.notify){
			const old= this.notify
			this.notify= next.done? Promise.resolve(): Deferrant()
			old.resolve( next.value)
		}
		return this
	}

	[ Symbol.asyncIterator]( opts){
		if( this.forkId){
			return this.tee( opts)
		}
		this.forkId= ++forkId
		return this
	}

	// give an iteration of existing state data to anyone who asks
	[ Symbol.iterator]( ...args){
		// look at retained state
		const iteration= this.state&& this.state[ Symbol.iterator]
		if( iteration){
			// & iterate through it all
			return iteration.call( this.state, ...args)
		}
	}

	// create a "fork" which reads via notify
	tee( opts){
		return new AsyncTeeFork( this, opts)
	}
}
export {
  AsyncIteratorTee as default,
  AsyncIteratorTee as asyncIteratorTee
}
