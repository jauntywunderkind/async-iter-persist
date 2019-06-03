import immediate from "p-immediate"
import Deferrant from "deferrant"

let val= Deferrant()
let c= 0
function inc(){
	return ++c
}
//async function next(){
//	return Promise.resolve(inc())
//}
//async function next(){
//	if( inc() % 128!== 0){
//		return Promise.resolve(c)
//	}else{
//		return immediate().then(inc)
//	}
//}
//async function next(){
//	val= Deferrant()
//	val.resolve(inc)
//	return val
//}

async function *generator1(){
	try{
		while(true){
			const val= await next()
			yield val
		}
	}catch(ex){
		console.log("err", ex)
	}
}

async function *generator2(){
	while(true){
		try{
			const val= await next()
			yield val
		}catch(ex){
			console.log("err", ex)
		}
	}
}

const FIXTURE= generator1

async function consume(){
	for await( const val of FIXTURE()){
	}
}

function terminate(){
	// this does terminate, very quickly
	//process.nextTick(()=> {
	//	console.log(c)
	//	process.exit(1)
	//})

	// this never fires!
	setTimeout(()=> {
		console.log(c)
		process.exit(1)
	}, 700)

	// this never fires!
	//setInterval(()=> {
	//	console.log(c)
	//	process.exit(1)
	//}, 10)
}

function main(){
	terminate();
	consume()
}
main()
