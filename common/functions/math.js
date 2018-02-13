import { evaluate } from 'tinymath';
import { datatableToMathContext } from '../lib/datatable_to_math_context.js';

export const math = () => ({
  name: 'math',
  type: 'number',
  help:
    'Interpret a math expression, with a number or datatable as context. Datatable columns are available by their column name. ' +
    'If you pass in a number it is available as "value" (without the quotes)',
  context: {
    types: ['number', 'datatable'],
  },
  args: {
    _: {
      types: ['string'],
      help: 'An evaluated tinymath expression. (See https://github.com/elastic/tinymath)',
    },
  },
  fn: (context, args) => {
    if (args._.trim() === '') {
      throw new Error('Empty expression');
    }
    const isDatatable = context && context.type === 'datatable';
    const mathContext = isDatatable ? datatableToMathContext(context) : { value: context };
    try {
      const result = evaluate(args._, mathContext);
      if (Array.isArray(result)) {
        throw new Error(
          'Expressions must return a single number. Try wrapping your expression in mean() or sum()'
        );
      }
      if (typeof result !== 'number')
        throw new Error('Failed to execute math expression. Check your column names');
      return result;
    } catch (e) {
      if (context.rows.length === 0) {
        throw new Error('Empty datatable');
      } else {
        throw e;
      }
    }
  },
});
