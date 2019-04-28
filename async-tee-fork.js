"use module"

let forkId= 0

export class AsyncTeeFork{
	constructor( asyncTee, options){
		// record parent
		if( !asyncTee){
			throw new Error( "Need an asyncTee")
		}
		this.asyncTee= asyncTee

		// record options & settings
		if( asyncTee.clearForkPosition){
			this.clearForkPosition= asyncTee.clearForkPosition
		}
		if( options){
			if( options.filter){
				// filter has the chance to modify items coming through
				this.filter= options.filter
			}
			if( options.clearForkPosition){
				this.clearForkPosition= options.clearForkPosition
			}
		}

		// iteration will return this promise. zalgo may be faster in some cases
		// but generally async-iterators are expected to return promises I think
		this.thisPromise= options&& options.zalgo|| asyncTee.zalgo? undefined: Promise.resolve( this)

		// iteration members
		this.done= false
		this.value= undefined
		this.next= this.next.bind( this)

		this.clear= this.clear.bind( this)
		// set up initial position
		this.clearForkPosition()
		// reset pos when parent signals clear
		asyncTee.clearPromise.then( this.clear)
		return this
	}
	next(){
		// rare-ish case: filter can terminate, while still waiting for a return value
		if( this.waitForDone){
			if( this.asyncTee.done){
				// parent iterator is now done: terminate
				this.done= this.asyncTee.done
				this.value= this.asyncTee.returnValue
				return this.thisPromise|| this
			}
			// notified, but we're still waiting to be done
			return this.asyncTee.notify.then( this.next)
		}
		// we're already done, so return
		if( this.done){
			return this.thisPromise|| this
		}

		const state= this.asyncTee.state
		if( !state){
			throw new Error( "Need an asyncTee#state")
		}

		// do we have state we can output now?
		if( this.pos< state.length){
			// read next state
			const nextPos= this.pos++
			let nextValue= state[ nextPos]

			// filter state - this further filters whatever the forked tee filters
			if( this.filter){
				// filter value
				const next= this.filter({ value: nextValue, done: false})
				if( !next){
					// dropped, go to next
					return this.next()
				}
				nextValue= next.value
				if( next.done){
					// filter says we're done: be done
					this.done= next.done

					if( next.waitForDone){
						// wait for asyncTee to settle then returnValue
						this.waitForDone= true
						return this.next()
					}

					// passReturn will immediately forward returnValue
					// whether asyncTee is settled or not
					if( next.passReturn){
						nextValue= this.asyncTee.returnValue
					}
				}
			}

			// record next
			this.value= nextValue
			if( nextPos>= state.length&& this.asyncTee.done){
				// end of state, and asyncTee is done
				this.done= true
			}
			return this.thisPromise|| this
		}else if( this.asyncTee.done){
			this.value= this.asyncTee.returnValue
			this.done= true
			return this.thisPromise|| this
		}
		if( !this.asyncTee.notify){
			throw new Error( "Need an asyncTee#notify")
		}
		return this.asyncTee.notify.then( this.next)
	}
	tee(){
		return new AsyncTeeFork( this.asyncTee)
	}
	[ Symbol.iterator](){
		return this.asyncTee[ Symbol.iterator]()
	}
	[ Symbol.asyncIterator](){
		if( !this.forkId){
			this.forkId= ++forkId
			return this
		}
		return new AsyncTeeFork( this.asyncTee)
	}
	clear(){
		this.clearForkPosition()
		const clearPromise= this.asyncTee&& this.asyncTee.clearPromise
		if( clearPromise){
			this.clearPromise.then( this.clear)
		}
	}
	clearForkPosition(){
		this.pos= 0
	}
}
let unboundNext= AsyncTeeFork.prototype.next
export {
  AsyncTeeFork as default,
  AsyncTeeFork as asyncTeeFork
}
