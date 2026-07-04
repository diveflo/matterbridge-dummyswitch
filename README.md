# matterbridge-dummyswitch

A very small Matterbridge plugin that exposes configured dummy controllable On/Off devices.

- `switch`: dummy On/Off switch, exposed using the Matter On/Off Plug-in Unit device type for broad controller compatibility.
- `outlet`: same Matter On/Off Plug-in Unit endpoint, named as an outlet.
- `light`: exposed as a Matter On/Off Light.

## Configuration

The Matterbridge config file keeps the plugin `name` and platform `type`; the plugin-specific UI only exposes `switches`.

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

## Development

```sh
npm install
npm run dev:link
npm run build
```

To build the uploadable plugin tarball for Matterbridge:

```sh
npm install
npm run dev:link
npm run cleanBuild
npm pack
```

