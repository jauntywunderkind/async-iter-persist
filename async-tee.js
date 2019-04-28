"use module"
import immediate from "p-immediate"
import Deferrant from "deferrant"
import AsyncTeeFork from "./async-tee-fork.js"

let forkId= 0

export class AsyncIteratorTee{
	static stateFactory(){
		return []
	}

	constructor( wrappedIterator,{ notify= false, signal, filter, state, stateFactory, free, asyncTeeFork}= {}){
		// underlying iterator that we are "tee"'ing
		this.wrappedIterator= wrappedIterator

		// initialize & clear via stateFactory
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
		if( free){
			this.free= free
		}
		if( asyncTeeFork){
			this.asyncTeeFork= asyncTeeFork
		}

		// pass through iterator values
		this.value= null
		this.done= false
		return this
	}

	// implement iterator next
	async next( ...args){
		// if we're done we should not do any more work
		if( this.done){
			return this
		}

		// get next value
		let next= await this.wrappedIterator.next( ...args)
		const wasDone= next&& next.done

		if( this.filter){
			// filter has power to modify any result
			next= this.filter( next)
		}

		if( !next){
			if( wasDone){
				// if we were done we're done, no avoiding that
				this.value= undefined
				this.done= wasDone
				return this._next()
			}
			// this element is missing, return the next element
			return this.next( ...args)
		}

		// pass through next value
		this.value= next.value
		this.done= next.done|| wasDone

		if( this.done){
			// terminate, capture returnValue
			this.returnValue= next.value
		}else{
			// or save
			this.push( next.value)
		}

		return this._next()
	}

	_next(){
		if( this.notify){
			// notify any listeners
			const oldNotify= this.notify
			this.notify= this.done? Promise.resolve(): Deferrant()
			oldNotify.resolve( this.value)
		}
		if( this.done){
			// cleanup
			this.free()
		}
		return this
	}
	free(){
		this.wrappedIterator= null
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

	/**
	* give an iteration of existing state data to anyone who asks
	*/
	[ Symbol.iterator]( ...args){
		// look at retained state
		const iteration= this.state&& this.state[ Symbol.iterator]
		if( iteration){
			// & iterate through it all
			return iteration.call( this.state, ...args)
		}
	}

	/**
	* create a "fork" which reads via notify
	*/
	tee( opts){
		return new (this.asyncTeeFork())( this, opts)
	}

	/**
	* add `newItem` to our state
	*/
	push( newItem){
		this.state.push( newItem)
	}

	clear(){
		const
		  // prepare to signal anyone awaiting this clear
		  currentClear= this.clearPromise,
		  // set up a new signaller for the next clear
		  clearPromise= this.clearPromise= Deferrant(),
		  // actually clear our state
		  state= this.state= this.stateFactory()
		if( currentClear){
			// do signal anyone awaiting this clear
			currentClear.resolve()
		}
	}

	asyncTeeFork(){
		return AsyncTeeFork
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
