import { ListView, VERSION } from '@pibytelabs/listkit'

export function HelloListKit() {
	return (
		<section className='rounded-lg border border-gray-200 bg-white p-6'>
			<h2 className='mb-2 text-xl font-semibold'>Hello listkit</h2>
			<p className='mb-4 text-sm text-gray-600'>
				Package version:{' '}
				<code className='rounded bg-gray-100 px-2 py-0.5'>{VERSION}</code>
			</p>
			<p className='text-sm text-gray-500'>
				The stub <code>ListView</code> renders null in v0.0.x. Real components
				arrive in v0.1.0.
			</p>
			<div className='mt-4 hidden'>
				<ListView id='demo' />
			</div>
		</section>
	)
}
