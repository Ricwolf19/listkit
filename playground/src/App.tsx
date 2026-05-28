import { HelloListKit } from './examples/HelloListKit'

export function App() {
	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<header className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-900'>listkit playground</h1>
				<p className='mt-1 text-gray-600'>
					Local development environment for @pibytelabs/listkit
				</p>
			</header>
			<main>
				<HelloListKit />
			</main>
		</div>
	)
}
