"use module"
import Pipe from "async-iter-pipe"
import Immediate from "p-immediate"
import tape from "tape"
import Persist from ".."

tape( "mark sweep", async function( t){
	t.plan( 4)
	const
	  pipe= new Pipe(),
	  persist= new Persist( pipe)

	// don't start mark yet
	pipe.produce( 1)
	persist.next()
	pipe.produce( 2)
	persist.next()
	pipe.produce( 3)
	persist.next()
	await Immediate()
	t.equal( persist.state.length, 3, "have three elements persisted")

	// start mark
	persist.mark()

	// retread & put in new element
	pipe.produce( 3)
	persist.next()
	pipe.produce( 4)
	persist.next()
	await Immediate()

	// sweep the elements which were not touched during mark
	const sweep= persist.sweep()
	t.equal( sweep.next().value, 1)
	t.equal( sweep.next().value, 2)
	t.equal( sweep.next().done, true, "got all")
	t.end()
})

