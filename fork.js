"use module"

let forkId= 0

export class AsyncIterPersistFork{
	constructor( asyncIterPersist, options){
		// record parent
		if( !asyncIterPersist){
			throw new Error( "Need an asyncIterPersist")
		}
		this.asyncIterPersist= asyncIterPersist

		// record options & settings
		if( asyncIterPersist.clearForkPosition){
			this.clearForkPosition= asyncIterPersist.clearForkPosition
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
		this.thisPromise= options&& options.zalgo|| asyncIterPersist.zalgo? undefined: Promise.resolve( this)

		// iteration members
		this.done= false
		this.value= undefined
		this.next= this.next.bind( this)

		this.clear= this.clear.bind( this)
		// set up initial position
		this.clearForkPosition()
		// reset pos when parent signals clear
		asyncIterPersist.clearPromise.then( this.clear)
		return this
	}
	next(){
		// rare-ish case: filter can terminate, while still waiting for a return value
		if( this.waitForDone){
			if( this.asyncIterPersist.done){
				// parent iterator is now done: terminate
				this.done= this.asyncIterPersist.done
				this.value= this.asyncIterPersist.returnValue
				return this.thisPromise|| this
			}
			// notified, but we're still waiting to be done
			return this.asyncIterPersist.notify.then( this.next)
		}
		// we're already done, so return
		if( this.done){
			return this.thisPromise|| this
		}

		const state= this.asyncIterPersist.state
		if( !state){
			throw new Error( "Need an asyncIterPersist#state")
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
						// wait for asyncIterPersist to settle then returnValue
						this.waitForDone= true
						return this.next()
					}

					// passReturn will immediately forward returnValue
					// whether asyncIterPersist is settled or not
					if( next.passReturn){
						nextValue= this.asyncIterPersist.returnValue
					}
				}
			}

			// record next
			this.value= nextValue
			if( nextPos>= state.length&& this.asyncIterPersist.done){
				// end of state, and asyncIterPersist is done
				this.done= true
			}
			//return this.thisPromise|| this // iteration tests fail with this
			return { value: this.value, done: this.done}
		}else if( this.asyncIterPersist.done){
			this.value= this.asyncIterPersist.returnValue
			this.done= true
			return this.thisPromise|| this
		}
		if( !this.asyncIterPersist.notify){
			throw new Error( "Need an asyncIterPersist#notify")
		}
		return this.asyncIterPersist.notify.then( this.next)
	}
	tee(){
		return new AsyncIterPersistFork( this.asyncIterPersist)
	}
	[ Symbol.iterator](){
		return this.asyncIterPersist[ Symbol.iterator]()
	}
	[ Symbol.asyncIterator](){
		if( !this.forkId){
			this.forkId= ++forkId
			return this
		}
		return new AsyncIterPersistFork( this.asyncIterPersist)
	}
	clear(){
		this.clearForkPosition()
		const clearPromise= this.asyncIterPersist&& this.asyncIterPersist.clearPromise
		if( clearPromise){
			this.clearPromise.then( this.clear)
		}
	}
	clearForkPosition(){
		this.pos= 0
	}
}
let unboundNext= AsyncIterPersistFork.prototype.next
export {
  AsyncIterPersistFork as default,
  AsyncIterPersistFork as asyncIterPersistFork,
  AsyncIterPersistFork as fork,
  AsyncIterPersistFork as Fork
}
