# vue3-atlas and vue3-cityatlas

This project is a remake of atlas.phila.gov using [Vue 3](https://vuejs.org/guide/introduction.html).  Most of the vue files are written using the Vue3 Composition API.

When pushed, it updates both atlas.phila.gov and cityatlas.phila.gov.  These 2 versions are controlled by a developer, and in the automated push, by the environmental variable VITE_VERSION.

See [the Github Wiki](https://github.com/CityOfPhiladelphia/vue3-atlas/wiki) for full documentation.
If you work for the City of Philadelphia, see [phila.city](https://phila.city/display/appdev/Atlas) for more information.

## Project Setup

Your environment should be node 20.x and npm 10.x

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

create an .env.local file and add the following:

VITE_PUBLICPATH=/ - this is needed for accessing images in the public folder

VITE_DEBUG=true - this will allow many console.logs to show in your dev envt

VITE_VERSION=atlas - switch this to cityatlas to see the cityatlas version of the app

### Other environmental variables for .env.local

A number of other environmental variables, for protected services, are needed for running Atlas.  See [https://phila.city/display/appdev/Atlas](https://phila.city/display/appdev/Atlas).


### Compile and Minify for Production



```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).
