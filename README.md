# matterbridge-dummyswitch

Matterbridge dummy switch plugin.

This plugin creates simple controllable Matter On/Off devices from static configuration. It is useful for testing Matterbridge setups, checking controller behavior, building automations around virtual switches, or creating placeholder devices while real hardware is not available.

## Features

- Create any number of dummy On/Off devices.
- Expose devices as a `switch`, `outlet`, or `light`.
- Keep each device state inside Matterbridge while the plugin is running.
- Configure devices from the Matterbridge UI or JSON config.
- No external services, credentials, hubs, or hardware required.

## Device Types

| Type     | Matter device exposed | Use when                                                   |
| -------- | --------------------- | ---------------------------------------------------------- |
| `switch` | On/Off Plug-in Unit   | You want a generic virtual switch.                         |
| `outlet` | On/Off Plug-in Unit   | You want the device named and presented as an outlet.      |
| `light`  | On/Off Light          | You want controllers to treat the dummy device as a light. |

`switch` and `outlet` intentionally use the same Matter On/Off Plug-in Unit endpoint for broad controller compatibility. `light` uses the Matter On/Off Light device type.

## Installation

Install the plugin from npm:

```sh
npm install -g matterbridge-dummyswitch
```

Or install it from the Matterbridge plugin UI by searching for:

```text
matterbridge-dummyswitch
```

This plugin requires Matterbridge `>= 3.8.0`.

## Configuration

The plugin configuration contains the standard Matterbridge `name` and `type` fields plus a `switches` array.

```json
{
  "name": "matterbridge-dummyswitch",
  "type": "DynamicPlatform",
  "switches": [
    {
      "name": "Desk Switch",
      "type": "switch"
    },
    {
      "name": "Dummy Outlet",
      "type": "outlet"
    },
    {
      "name": "Dummy Light",
      "type": "light"
    }
  ]
}
```

Each item in `switches` supports:

| Field  | Required | Description                                                                  |
| ------ | -------- | ---------------------------------------------------------------------------- |
| `name` | Yes      | Display name for the dummy device. Empty names are ignored.                  |
| `type` | Yes      | One of `switch`, `outlet`, or `light`. Unknown values fall back to `switch`. |

If `switches` is empty or omitted, the plugin starts without creating any dummy devices.

## Behavior Notes

- Devices are created when Matterbridge starts.
- Adding, removing, or renaming configured dummy devices requires a Matterbridge restart to apply endpoint changes.
- Dummy devices start with `onOff` set to `false`.
- Device serial numbers are generated from the configured order and name, for example `matterbridge-dummyswitch-1-desk-switch`.
- Set `unregisterOnShutdown` only if you intentionally want Matterbridge to unregister all plugin devices during shutdown.

## Release

CI runs formatting, linting, type checking, coverage tests, and the production build on pushes and pull requests.

Publishing is handled by the GitHub `Publish to npm` workflow. It bumps the patch version, pushes the release commit and tag, and publishes to npm with provenance through npm Trusted Publishing.
