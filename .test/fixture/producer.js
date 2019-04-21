"use module"
import immediate from "p-immediate"

export async function *producer( n= Number.POSITIVE_INFINITY){
	let cursor= 0
	while( cursor< n){
		await immediate()
		yield cursor++
	}
}
export default producer

//async function next(){
//	if( inc() % 128!== 0){
//		return Promise.resolve(c)
//	}else{
//		return immediate().then(inc)
//	}
//}
