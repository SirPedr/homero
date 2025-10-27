import {test, expect} from 'bun:test';
import {render} from '@testing-library/react';
import Loader from './loader';

test('Loader component renders and is in the document', () => {
	const {container} = render(<Loader />);
	const loader = container.querySelector('svg');
	expect(loader).toBeInTheDocument();
	expect(loader).toHaveClass('animate-spin');
});
