"use module"

let forkId= 0

export class AsyncTeeFork{
	constructor( asyncTee, options){
		if( !asyncTee){
			throw new Error( "Need an asyncTee")
		}
		// keep track of how much state we've seen
		this.pos= 0
		this.asyncTee= asyncTee
		// iteration will return this promise. zalgo may be faster in some cases
		// but generally async-iterators are expected to return promises I think
		this.thisPromise= options&& options.zalgo? undefined: Promise.resolve( this)

		// iteration members
		this.next= this.next.bind( this)
		this.done= false
		this.value= undefined
		return this
	}
	next(){
		const state= this.asyncTee.state
		if( !state){
			throw new Error( "Need an asyncTee#state")
		}
		if( this.pos< state.length){
			const nextPos= this.pos++
			this.value= state[ nextPos]
			if( nextPos>= state.length&& this.asyncTee.done){
				this.done= true
			}
			return this.thisPromise|| this
		}else if( this.asyncTee.done){
			this.value= this.asyncTee.lastValue
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
}
let unboundNext= AsyncTeeFork.prototype.next
export {
  AsyncTeeFork as default,
  AsyncTeeFork as asyncTeeFork
}
