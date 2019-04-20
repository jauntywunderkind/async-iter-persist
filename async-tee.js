import immediate from "p-immediate"

export function asyncIteratorTee( asyncIter, { notify: true}= {}){
	const self= this instanceof asyncIteratorTee? this: {}
	self.state= []
	self[ Symbol.iterator]: function(){
		const iteration= self.state[ Symbol.iterator]
		if( iteration){
			return iteration.call( self.state)
		}
	}

	self.fork= function( ){
		
	}
	self.next= function( arg){
		
	}


	immediate().then(

	return self
}
