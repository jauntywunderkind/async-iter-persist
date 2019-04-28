"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

let forkId= 0

export class AsyncIteratorTee{
	static stateFactory(){
		return []
	}

	constructor( wrappedIterator,{ notify= false, signal, filter, state, stateFactory}= {}){
		// underlying iterator that we are "tee"'ing
		this.wrappedIterator= wrappedIterator

		if( stateFactory){
			this.stateFactory= stateFactory
		}
		// state is the existing data that's been seen, the 'tee'
		this.state= state!== undefined? state: this.stateFactory()
		this.returnValue= undefined
		// signals to AsyncTeeFork's that they ought clear
		this.clearPromise= Deferrant()
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
	async next( ...inputs){
		// if we're done we should not do any more work
		if( this.done){
			return this
		}

		// get next value
		const next= await this.wrappedIterator.next( ...inputs)

		if( this.filter){
			const wasDone= next.done

			// filter has power to modify any result
			next= this.filter( next)

			// if we're done we're done, no avoiding that
			if( wasDone){
				this.done= wasDone
			}

			// return false to drop an element
			if( !next){
				// find the next element
				return this.next( ...inputs)
			}
		}

		// pass through next value
		this.value= next.value

		if( next.done){
			// we too are done
			this.done= next.done
			// capture returnValue
			this.returnValue= next.value

			if( !this.noCleanup){
				// allow underlying iterator to be freed
				this.wrappedIterator= null
			}
		}else if( this.push){
			// if we are keeping state, add it
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
		this.state.push( state)
	}

	clear(){
		const
		  currentClear= this.clearPromise,
		  nextClear= this.clearPromise= Deferrant()
		this.state= this.stateFactory()
		currentClear.resolve({ next: this.clearPromise})
	}

	stateFactory( ...args){
		return this.constructor.stateFactory( ...args)
	}

	/**
	* provide a consistent means to get the base asyncTee, for consumers of AsyncTee or AsyncTeeFork
	*/
	get asyncTee(){
		return this
	}
}
export {
  AsyncIteratorTee as default,
  AsyncIteratorTee as asyncIteratorTee
}
