import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DummySwitchPlatformConfig } from '../src/module.js';

const matterbridgeMock = vi.hoisted(() => {
  const onOffLight = { name: 'onOffLight' };
  const onOffPlugInUnit = { name: 'onOffPlugInUnit' };

  type BasicInformation = {
    name: string;
    serialNumber: string;
    vendorId: number;
    vendorName: string;
    productName: string;
    productId: number;
    productVersion: string;
  };

  class MatterbridgeEndpoint {
    public readonly attributes: Array<{ cluster: unknown; attribute: string; value: unknown }> = [];
    public basicInformation?: BasicInformation;
    public powerSourceWired = false;
    public requiredClusters = false;

    constructor(
      public readonly deviceType: unknown,
      public readonly options: { id: string },
    ) {}

    createDefaultBridgedDeviceBasicInformationClusterServer(
      name: string,
      serialNumber: string,
      vendorId: number,
      vendorName: string,
      productName: string,
      productId: number,
      productVersion: string,
    ): this {
      this.basicInformation = { name, serialNumber, vendorId, vendorName, productName, productId, productVersion };
      return this;
    }

    createDefaultPowerSourceWiredClusterServer(): this {
      this.powerSourceWired = true;
      return this;
    }

    addRequiredClusters(): this {
      this.requiredClusters = true;
      return this;
    }

    async setAttribute(cluster: unknown, attribute: string, value: unknown): Promise<void> {
      this.attributes.push({ cluster, attribute, value });
    }
  }

  const registeredDevices: MatterbridgeEndpoint[] = [];
  const registerDevice = vi.fn(async (endpoint: MatterbridgeEndpoint) => {
    registeredDevices.push(endpoint);
  });
  const unregisterAllDevices = vi.fn(async () => {});
  const baseOnConfigChanged = vi.fn(async (_config: unknown) => {});
  const baseOnShutdown = vi.fn(async (_reason?: string) => {});
  const verifyMatterbridgeVersion = vi.fn((_version: string) => true);
  let ready: Promise<void> = Promise.resolve();

  class MatterbridgeDynamicPlatform {
    public readonly ready: Promise<void>;
    public readonly matterbridge: { matterbridgeVersion: string; aggregatorVendorId: number };

    constructor(
      matterbridge: { matterbridgeVersion: string; aggregatorVendorId: number },
      public readonly log: { info: (message: string) => void },
      public readonly config: { unregisterOnShutdown?: boolean },
    ) {
      this.matterbridge = matterbridge;
      this.ready = ready;
    }

    verifyMatterbridgeVersion(version: string): boolean {
      return verifyMatterbridgeVersion(version);
    }

    async registerDevice(endpoint: MatterbridgeEndpoint): Promise<void> {
      await registerDevice(endpoint);
    }

    async unregisterAllDevices(): Promise<void> {
      await unregisterAllDevices();
    }

    async onConfigChanged(config: unknown): Promise<void> {
      await baseOnConfigChanged(config);
    }

    async onShutdown(reason?: string): Promise<void> {
      await baseOnShutdown(reason);
    }
  }

  return {
    baseOnConfigChanged,
    baseOnShutdown,
    MatterbridgeDynamicPlatform,
    MatterbridgeEndpoint,
    onOffLight,
    onOffPlugInUnit,
    registeredDevices,
    registerDevice,
    setReady: (value: Promise<void>) => {
      ready = value;
    },
    unregisterAllDevices,
    verifyMatterbridgeVersion,
  };
});

const clustersMock = vi.hoisted(() => ({
  OnOff: { name: 'OnOff' },
}));

vi.mock('matterbridge', () => ({
  MatterbridgeDynamicPlatform: matterbridgeMock.MatterbridgeDynamicPlatform,
  MatterbridgeEndpoint: matterbridgeMock.MatterbridgeEndpoint,
  onOffLight: matterbridgeMock.onOffLight,
  onOffPlugInUnit: matterbridgeMock.onOffPlugInUnit,
}));

vi.mock('matterbridge/logger', () => ({
  LogLevel: {
    INFO: 'info',
  },
}));

vi.mock('matterbridge/matter/clusters', () => clustersMock);

const createMatterbridge = () => ({
  matterbridgeVersion: '3.8.0',
  aggregatorVendorId: 65521,
});

const createLog = () => ({
  info: vi.fn(),
});

const createDeferred = () => {
  let resolvePromise!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
};

const createConfig = (overrides: Partial<DummySwitchPlatformConfig> = {}): DummySwitchPlatformConfig => ({
  name: 'plugin',
  type: 'DynamicPlatform',
  version: '1.0.0',
  debug: false,
  unregisterOnShutdown: false,
  ...overrides,
});

describe('matterbridge-dummyswitch module', () => {
  beforeEach(() => {
    matterbridgeMock.registeredDevices.length = 0;
    matterbridgeMock.registerDevice.mockClear();
    matterbridgeMock.unregisterAllDevices.mockClear();
    matterbridgeMock.baseOnConfigChanged.mockClear();
    matterbridgeMock.baseOnShutdown.mockClear();
    matterbridgeMock.verifyMatterbridgeVersion.mockClear();
    matterbridgeMock.verifyMatterbridgeVersion.mockReturnValue(true);
    matterbridgeMock.setReady(Promise.resolve());
  });

  it('exports the Matterbridge plugin entry point and platform class', async () => {
    const { default: initializePlugin, DummySwitchPlatform } = await import('../src/module.js');

    expect(initializePlugin).toBeTypeOf('function');
    expect(DummySwitchPlatform).toBeTypeOf('function');
  });

  it('creates a DummySwitchPlatform from the default plugin entry point', async () => {
    const { default: initializePlugin, DummySwitchPlatform } = await import('../src/module.js');

    const platform = initializePlugin(createMatterbridge() as never, createLog() as never, createConfig({ name: 'matterbridge-dummyswitch' }));

    expect(platform).toBeInstanceOf(DummySwitchPlatform);
    expect(matterbridgeMock.verifyMatterbridgeVersion).toHaveBeenCalledWith('3.8.0');
  });

  it('rejects Matterbridge versions older than the plugin requires', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    matterbridgeMock.verifyMatterbridgeVersion.mockReturnValue(false);

    expect(() => new DummySwitchPlatform({ ...createMatterbridge(), matterbridgeVersion: '3.7.9' } as never, createLog() as never, createConfig())).toThrow(
      'This plugin requires Matterbridge version >= "3.8.0". Please update Matterbridge from 3.7.9.',
    );
  });

  it('rejects Matterbridge versions when the compatibility helper is unavailable', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const prototype = matterbridgeMock.MatterbridgeDynamicPlatform.prototype as {
      verifyMatterbridgeVersion?: (version: string) => boolean;
    };
    const verifyMatterbridgeVersion = prototype.verifyMatterbridgeVersion;
    prototype.verifyMatterbridgeVersion = undefined;

    try {
      expect(() => new DummySwitchPlatform(createMatterbridge() as never, createLog() as never, createConfig())).toThrow(
        'This plugin requires Matterbridge version >= "3.8.0". Please update Matterbridge from 3.8.0.',
      );
      expect(matterbridgeMock.verifyMatterbridgeVersion).not.toHaveBeenCalled();
    } finally {
      prototype.verifyMatterbridgeVersion = verifyMatterbridgeVersion;
    }
  });

  it('registers configured switch, outlet, and light endpoints with stable defaults', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const platform = new DummySwitchPlatform(
      createMatterbridge() as never,
      createLog() as never,
      createConfig({
        switches: [
          { name: ' Desk Switch ', type: 'switch' },
          { name: 'Dummy Outlet', type: 'outlet' },
          { name: 'Kitchen Light', type: 'light' },
          { name: 'Mystery Device', type: 'unknown' as never },
          { name: '!!!', type: 'switch' },
          { name: '   ', type: 'light' },
          { name: 42 as never, type: 'outlet' },
        ],
      }),
    );

    await platform.onStart('test');

    expect(matterbridgeMock.registerDevice).toHaveBeenCalledTimes(5);
    expect(matterbridgeMock.registeredDevices.map((endpoint) => endpoint.deviceType)).toEqual([
      matterbridgeMock.onOffPlugInUnit,
      matterbridgeMock.onOffPlugInUnit,
      matterbridgeMock.onOffLight,
      matterbridgeMock.onOffPlugInUnit,
      matterbridgeMock.onOffPlugInUnit,
    ]);
    expect(matterbridgeMock.registeredDevices.map((endpoint) => endpoint.options.id)).toEqual([
      'matterbridge-dummyswitch-1-desk-switch',
      'matterbridge-dummyswitch-2-dummy-outlet',
      'matterbridge-dummyswitch-3-kitchen-light',
      'matterbridge-dummyswitch-4-mystery-device',
      'matterbridge-dummyswitch-5-switch',
    ]);
    expect(matterbridgeMock.registeredDevices.map((endpoint) => endpoint.basicInformation?.productName)).toEqual([
      'Matterbridge Dummy Switch',
      'Matterbridge Dummy Outlet',
      'Matterbridge Dummy Light',
      'Matterbridge Dummy Switch',
      'Matterbridge Dummy Switch',
    ]);
    expect(matterbridgeMock.registeredDevices[0]?.basicInformation).toEqual({
      name: 'Desk Switch',
      serialNumber: 'matterbridge-dummyswitch-1-desk-switch',
      vendorId: 65521,
      vendorName: 'Matterbridge',
      productName: 'Matterbridge Dummy Switch',
      productId: 1,
      productVersion: '1.0.0',
    });
    expect(matterbridgeMock.registeredDevices.every((endpoint) => endpoint.powerSourceWired && endpoint.requiredClusters)).toBe(true);
    expect(matterbridgeMock.registeredDevices.map((endpoint) => endpoint.attributes)).toEqual([
      [{ cluster: clustersMock.OnOff, attribute: 'onOff', value: false }],
      [{ cluster: clustersMock.OnOff, attribute: 'onOff', value: false }],
      [{ cluster: clustersMock.OnOff, attribute: 'onOff', value: false }],
      [{ cluster: clustersMock.OnOff, attribute: 'onOff', value: false }],
      [{ cluster: clustersMock.OnOff, attribute: 'onOff', value: false }],
    ]);
  });

  it('waits for Matterbridge readiness before registering endpoints', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const ready = createDeferred();
    const log = createLog();
    matterbridgeMock.setReady(ready.promise);
    const platform = new DummySwitchPlatform(createMatterbridge() as never, log as never, createConfig({ switches: [{ name: 'Delayed Switch', type: 'switch' }] }));

    const start = platform.onStart('bridge ready');

    expect(log.info).toHaveBeenCalledWith('Starting dummy switch platform (bridge ready)');
    expect(matterbridgeMock.registerDevice).not.toHaveBeenCalled();

    ready.resolve();
    await start;

    expect(matterbridgeMock.registerDevice).toHaveBeenCalledTimes(1);
  });

  it('starts without registering endpoints when switches are omitted', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const log = createLog();
    const platform = new DummySwitchPlatform(createMatterbridge() as never, log as never, createConfig());

    await platform.onStart();

    expect(log.info).toHaveBeenCalledWith('Starting dummy switch platform');
    expect(matterbridgeMock.registerDevice).not.toHaveBeenCalled();
  });

  it('updates normalized switch config and logs that endpoint changes need a restart', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const log = createLog();
    const platform = new DummySwitchPlatform(createMatterbridge() as never, log as never, createConfig());
    const updatedConfig = createConfig({
      switches: [
        { name: 'New Light', type: 'light' },
        { name: '', type: 'outlet' },
      ],
    });

    await platform.onConfigChanged(updatedConfig);
    await platform.onStart();

    expect(matterbridgeMock.baseOnConfigChanged).toHaveBeenCalledWith(updatedConfig);
    expect(log.info).toHaveBeenCalledWith('Config changed: 1 dummy switch(es) configured. Restart Matterbridge to apply endpoint changes.');
    expect(matterbridgeMock.registeredDevices).toHaveLength(1);
    expect(matterbridgeMock.registeredDevices[0]?.deviceType).toBe(matterbridgeMock.onOffLight);
  });

  it('logs logger level changes', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const log = createLog();
    const platform = new DummySwitchPlatform(createMatterbridge() as never, log as never, createConfig());

    await platform.onChangeLoggerLevel('debug' as never);

    expect(log.info).toHaveBeenCalledWith('Logger level changed to debug');
  });

  it('unregisters devices on shutdown only when configured', async () => {
    const { DummySwitchPlatform } = await import('../src/module.js');
    const unregisteringLog = createLog();
    const unregisteringPlatform = new DummySwitchPlatform(createMatterbridge() as never, unregisteringLog as never, createConfig({ unregisterOnShutdown: true }));

    await unregisteringPlatform.onShutdown('test');

    expect(matterbridgeMock.baseOnShutdown).toHaveBeenCalledWith('test');
    expect(unregisteringLog.info).toHaveBeenCalledWith('Shutting down dummy switch platform (test)');
    expect(matterbridgeMock.unregisterAllDevices).toHaveBeenCalledTimes(1);

    const keepingLog = createLog();
    const keepingPlatform = new DummySwitchPlatform(createMatterbridge() as never, keepingLog as never, createConfig());

    await keepingPlatform.onShutdown();

    expect(keepingLog.info).toHaveBeenCalledWith('Shutting down dummy switch platform');
    expect(matterbridgeMock.unregisterAllDevices).toHaveBeenCalledTimes(1);
  });
});
