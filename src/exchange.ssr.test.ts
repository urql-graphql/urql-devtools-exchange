/**
 * @jest-environment node
 */
import { fromValue } from 'wonka';
import * as messengers from './utils';

const createNativeMessenger = jest.spyOn(messengers, 'createNativeMessenger');
const createBrowserMessenger = jest.spyOn(messengers, 'createBrowserMessenger');

it('returns forwarding exchange', () => {
  (global as any).window = undefined;
  const { devtoolsExchange } = require('./exchange'); // eslint-disable-line
  expect(createNativeMessenger).toBeCalledTimes(0);
  expect(createBrowserMessenger).toBeCalledTimes(0);

  const value = fromValue('Heloo');
  const forward = jest.fn();

  devtoolsExchange({ forward })(value);
  expect(forward).toBeCalledTimes(1);
  expect(forward).toBeCalledWith(value);
});
