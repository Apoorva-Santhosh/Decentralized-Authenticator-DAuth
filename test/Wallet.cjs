const assert = require('node:assert/strict');

describe('Wallet and password validation', function () {
  let server, getAuthContract, validatePassword;
  const originalWindow = global.window;
  const address = '0x0000000000000000000000000000000000000001';

  before(async function () {
    const { createServer } = await import('vite');
    server = await createServer({
      configFile: false,
      server: { middlewareMode: true, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    ({ getAuthContract, validatePassword } = await server.ssrLoadModule('/utils/wallet.js'));
  });

  after(async function () {
    if (originalWindow === undefined) delete global.window;
    else global.window = originalWindow;
    await server?.close();
  });

  function wallet(chainId = '0x7a69', code = '0x6000') {
    global.window = { ethereum: {
      request: async ({ method }) => {
        if (method === 'eth_chainId') return chainId;
        if (method === 'eth_getCode') return code;
        if (method === 'eth_accounts') return [address];
        if (method === 'eth_blockNumber') return '0x1';
        throw new Error(`Unexpected RPC method: ${method}`);
      },
    } };
  }

  it('rejects empty and whitespace-only passwords', function () {
    assert.throws(() => validatePassword(''), /non-empty password/);
    assert.throws(() => validatePassword(' \t '), /non-empty password/);
    assert.doesNotThrow(() => validatePassword(' password '));
  });

  it('explains when no wallet is installed', async function () {
    global.window = {};
    await assert.rejects(getAuthContract(), /install MetaMask/);
  });

  it('rejects the wrong network before calling the contract', async function () {
    wallet('0x1');
    await assert.rejects(getAuthContract(), /chain ID 31337/);
  });

  it('rejects a missing contract on the correct network', async function () {
    wallet('0x7a69', '0x');
    await assert.rejects(getAuthContract(), /not deployed/);
  });

  it('binds writes to the checked wallet address', async function () {
    wallet();
    const { contract } = await getAuthContract(true);
    assert.equal(await contract.signer.getAddress(), address);
  });
});
