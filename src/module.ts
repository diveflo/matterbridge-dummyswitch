/**
 * Very small Matterbridge dummy switch plugin.
 *
 * @file module.ts
 * @license Apache-2.0
 */

import { BasePlatformConfig, MatterbridgeDynamicPlatform, MatterbridgeEndpoint, onOffLight, onOffPlugInUnit, PlatformMatterbridge } from 'matterbridge';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import { OnOff } from 'matterbridge/matter/clusters';

export type DummySwitchType = 'switch' | 'outlet' | 'light';

export type DummySwitchConfig = {
  name: string;
  type: DummySwitchType;
};

export type DummySwitchPlatformConfig = BasePlatformConfig & {
  switches?: DummySwitchConfig[];
};

export default function initializePlugin(matterbridge: PlatformMatterbridge, log: AnsiLogger, config: DummySwitchPlatformConfig): DummySwitchPlatform {
  return new DummySwitchPlatform(matterbridge, log, config);
}

export class DummySwitchPlatform extends MatterbridgeDynamicPlatform {
  private switches: DummySwitchConfig[];

  constructor(matterbridge: PlatformMatterbridge, log: AnsiLogger, config: DummySwitchPlatformConfig) {
    super(matterbridge, log, config);

    if (typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('3.8.0')) {
      throw new Error(`This plugin requires Matterbridge version >= "3.8.0". Please update Matterbridge from ${this.matterbridge.matterbridgeVersion}.`);
    }

    this.switches = this.normalizeSwitches(config.switches);
  }

  override async onStart(reason?: string): Promise<void> {
    this.log.info(`Starting dummy switch platform${reason ? ` (${reason})` : ''}`);
    await this.ready;
    await this.registerDummySwitches();
  }

  override async onChangeLoggerLevel(logLevel: LogLevel): Promise<void> {
    this.log.info(`Logger level changed to ${logLevel}`);
  }

  override async onConfigChanged(config: DummySwitchPlatformConfig): Promise<void> {
    await super.onConfigChanged(config);
    this.switches = this.normalizeSwitches(config.switches);
    this.log.info(`Config changed: ${this.switches.length.toString()} dummy switch(es) configured. Restart Matterbridge to apply endpoint changes.`);
  }

  override async onShutdown(reason?: string): Promise<void> {
    await super.onShutdown(reason);
    this.log.info(`Shutting down dummy switch platform${reason ? ` (${reason})` : ''}`);

    if (this.config.unregisterOnShutdown) await this.unregisterAllDevices();
  }

  private async registerDummySwitches(): Promise<void> {
    for (const [index, dummySwitch] of this.switches.entries()) {
      await this.registerDummySwitch(dummySwitch, index);
    }
  }

  private async registerDummySwitch(dummySwitch: DummySwitchConfig, index: number): Promise<void> {
    const deviceType = dummySwitch.type === 'light' ? onOffLight : onOffPlugInUnit;
    const productName = dummySwitch.type === 'light' ? 'Matterbridge Dummy Light' : dummySwitch.type === 'outlet' ? 'Matterbridge Dummy Outlet' : 'Matterbridge Dummy Switch';
    const serialNumber = `matterbridge-dummyswitch-${index + 1}-${this.slugify(dummySwitch.name)}`;

    const switchEndpoint = new MatterbridgeEndpoint(deviceType, { id: serialNumber })
      .createDefaultBridgedDeviceBasicInformationClusterServer(dummySwitch.name, serialNumber, this.matterbridge.aggregatorVendorId, 'Matterbridge', productName, 1, '1.0.0')
      .createDefaultPowerSourceWiredClusterServer()
      .addRequiredClusters();

    await switchEndpoint.setAttribute(OnOff, 'onOff', false);
    await this.registerDevice(switchEndpoint);
  }

  private normalizeSwitches(switches: DummySwitchPlatformConfig['switches']): DummySwitchConfig[] {
    if (!Array.isArray(switches)) return [];

    return switches
      .map((dummySwitch) => ({
        name: typeof dummySwitch.name === 'string' ? dummySwitch.name.trim() : '',
        type: this.normalizeSwitchType(dummySwitch.type),
      }))
      .filter((dummySwitch) => dummySwitch.name.length > 0);
  }

  private normalizeSwitchType(switchType: unknown): DummySwitchType {
    if (switchType === 'outlet' || switchType === 'light' || switchType === 'switch') return switchType;
    return 'switch';
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'switch'
    );
  }
}
