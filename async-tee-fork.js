"use module"

export async function AsyncTeeForkX( asyncTee){
	this.pos= 0
	this.asyncTee= asyncTee

	this.done= asyncTee.done
	this.value= 
	this.next= ()=> {
		
	}
}

export class AsyncTeeFork{
	constructor( asyncTee){
		if( !asyncTee){
			throw new Error( "Need an asyncTee")
		}
		if( !asyncTee.notify){
			throw new Error( "Need an asyncTee#notify")
		}
		this.asyncTee= asyncTee
		this.pos= 0
	}
	[ Symbol.iterator](...args){
		// do a complete replay of current state
		return asyncTee.state[ Symbol.iterator](...args)
	}
	// fast iterator
	async*[ Symbol.asyncIterator](){
		//return new AsyncTeeFork( self.asyncTee)
		let
		  // count how many elements we've read
		  pos= 0,
		  self= this
		function *spool(){
			// find current state
			const state= self.asyncTee.state
			if( !state){
				throw new Error( "Need an asyncTee#state")
			}
			// while there's more state left
			while( pos< state.length){
				// yield it
				yield state[ pos++]
			}
		}
		// yield all known state
		yield *spool()
		while( true){
			// wait for more data
			await self.asyncTee.notify
			// yield new data
			yield *spool()
		}
	}
	next(){
	}
}
export {
  AsyncTeeFork as default,
  AsyncTeeFork as asyncTeeFork
}
