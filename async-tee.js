"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

let forkId= 0

export class AsyncIteratorTee{
	constructor( asyncIter,{ notify= false, signal, lastValue}= {}){
		// underlying iterator that we are "tee"'ing
		this.asyncIter= asyncIter
		// whether or not to store the return value
		if( lastValue!== undefined){
			this.lastValue= lastValue
		}

		// state is the existing data that's been seen, the 'tee'
		this.state= []
		// notify is a rotating signals listeners that there is new data
		if( notify){
			this.notify= Deferrant()
		}

		// pass through iterator values
		this.value= null
		this.done= false
	}

	// implement iterator next
	async next( arg){
		// get next value
		const next= await this.asyncIter.next()
		// pass through next value
		this.done= next.done
		this.value= next.value

		// append value to retained 'state'
		OUTTER: if( this.state){
			if( this.done){
				if( this.lastValue=== false){
					break OUTTER
				}
				if( this.lastValue!== true&& this.value=== undefined){
					break OUTTER
				}
			}
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

	[ Symbol.asyncIterator](){
		if( this.forkId){
			return this.tee()
		}
		this.forkId= ++forkId
		return this
	}

	// give an iteration of existing state data to anyone who asks
	[ Symbol.iterator](...args){
		// look at retained state
		const iteration= this.state&& this.state[ Symbol.iterator]
		if( iteration){
			// & iterate through it all
			return iteration.call( this.state, ...args)
		}
	}

	// create a "fork" which reads via notify
	tee(){
		return new AsyncTeeFork( this)
	}
}
export {
  AsyncIteratorTee as default,
  AsyncIteratorTee as asyncIteratorTee
}
