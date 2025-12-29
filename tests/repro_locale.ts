
import { z } from 'zod';

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
  });

const test = (input: any) => {
    const result = localeSchema.safeParse(input);
    console.log(`Input: "${input}" (${typeof input}) -> Success: ${result.success}`);
    if (!result.success) {
        console.log('Error:', result.error.issues[0].message);
    } else {
        console.log('Output:', result.data);
    }
    console.log('---');
};

test('br');
test('BR');
test(' br ');
test('en');
test('pt-BR');
test('pt_BR');
test('');
test(undefined);
test(null);
