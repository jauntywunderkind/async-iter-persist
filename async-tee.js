"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

let forkId= 0

export class AsyncIteratorTee{
	constructor( asyncIter,{ notify= false, signal, filter, state}= {}){
		// underlying iterator that we are "tee"'ing
		this.asyncIter= asyncIter

		// state is the existing data that's been seen, the 'tee'
		this.state= state instanceof Function? state( this): state|| []
		this.returnValue= undefined
		// notify is a rotating signals listeners that there is new data
		if( notify){
			this.notify= Deferrant()
		}
		if( filter){
			this.filter= filter
		}

		// pass through iterator values
		this.value= null
		this.done= false
		return this
	}

	// implement iterator next
	async next( arg){
		// if we're done we should not do any more work
		if( this.done){
			return this
		}

		// get next value
		const next= await this.asyncIter.next()

		// filter has full power to modify any result
		if( this.filter){
			next= this.filter( next)
			// return false to drop an element
			if( !next){
				// find the next element
				return this.next()
			}
		}

		// pass through next value
		this.done= next.done
		this.value= next.value

		// look for termination
		if( next.done){
			// append value to retained 'state'
			this.returnValue= next.value
			if( !this.noCleanup){
				// allow underlying iterator to be freed
				this.asyncIter= null
			}
		// if we are keeping state, add it
		}else if( this.push){
			this.push( next.value)
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
		}else{
			// doing this to be consistent with tee- it's kind of weird but ok
			if( opts&& opts.filter){
				this.filter= filter
			}
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

	push( state){
		if( this.state){
			this.state.push( state)
		}
	}
}
export {
  AsyncIteratorTee as default,
  AsyncIteratorTee as asyncIteratorTee
}
