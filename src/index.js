import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);
it
  return 'Hello, world!';
});

export const handler = resolver.getDefinitions();
