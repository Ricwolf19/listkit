import { VERSION, ListView } from '@pibytelabs/listkit'

export function HelloListKit() {
	return (
		<section className='bg-white border border-gray-200 rounded-lg p-6'>
			<h2 className='text-xl font-semibold mb-2'>Hello listkit</h2>
			<p className='text-sm text-gray-600 mb-4'>
				Package version:{' '}
				<code className='bg-gray-100 px-2 py-0.5 rounded'>
					{VERSION}
				</code>
			</p>
			<p className='text-sm text-gray-500'>
				The stub <code>ListView</code> renders null in v0.0.x. Real
				components arrive in v0.1.0.
			</p>
			<div className='mt-4 hidden'>
				<ListView id='demo' />
			</div>
		</section>
	)
}
