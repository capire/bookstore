# @capire/bookstore

A composite app of

- [bookshop](https://github.com/capire/bookshop) – a simple [primer app](https://cap.cloud.sap/docs/get-started/in-a-nutshell)
- [reviews](https://github.com/capire/reviews) - a generic reuse service
- [orders](https://github.com/capire/orders) - a generic reuse service
- [common](https://github.com/capire/common) - a reuse content package
- [SAP Fiori Elements UIs](app)


### Get it

```sh
git clone https://github.com/capire/bookstore
cd bookstore
npm install
```

> This repository uses the [github npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for the `@capire` scope. You may need to login using a github personal access token with scope `read:packages`.
> ```sh
> npm login --scope @capire --registry=https://npm.pkg.github.com
> ```


### Run it

```sh
cds watch
```


## License

Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
