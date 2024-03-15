import { stringifyModel } from './form.util';

describe('stringifyModel', () => {
  it('should stringify the model object with all keys sorted', () => {
    const model = {
      name: 'John',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'New York',
      },
    };

    const expectedString = '{"address":{"city":"New York","street":"123 Main St"},"age":30,"name":"John"}';
    const result = stringifyModel(model);

    expect(result).toEqual(expectedString);
  });

  it('should handle a model object with nested arrays', () => {
    const model = {
      name: 'John',
      hobbies: ['reading', 'coding', 'gaming'],
    };

    const expectedString = '{"hobbies":["reading","coding","gaming"],"name":"John"}';
    const result = stringifyModel(model);

    expect(result).toEqual(expectedString);
  });

  it('should return empty string when model is falsy', () => {
    const model = undefined;

    const result = stringifyModel(model);

    expect(result).toEqual('');
  });

  it('should return empty string when model is empty object', () => {
    const model = {};

    const result = stringifyModel(model);

    expect(result).toEqual('');
  });
});
