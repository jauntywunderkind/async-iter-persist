import immediate from "p-immediate"
import Deferrant from "deferrant"

export function asyncIteratorTee( asyncIter, { notify= false, signal}= {}){
	const self= this instanceof asyncIteratorTee? this: {}
	self.state= []
	self[ Symbol.iterator]= function(){
		const iteration= self.state[ Symbol.iterator]
		if( iteration){
			return iteration.call( self.state)
		}
	}
	if( notify){
		self.notify= Deferrant()
	}

	self.next= async function( arg){
		const next= await asyncIter.next()
		self.state.push( next.value)
		self.value= next.value
		self.done= next.done
		if( notify){
			self.notify.resolve( next.value)
			if( !next.done){
				self.notify= Deferrant()
			}
		}
		return self
	}
	self.value= null
	self.done= false

	//self.fork= function( ){}

	return self
}
