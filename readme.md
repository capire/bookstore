# @capire/bookstore

A composite app of

- [bookshop](../bookshop) – a simple [primer app](https://cap.cloud.sap/docs/get-started/in-a-nutshell)
- [reviews](../reviews) - a generic reuse service
- [orders](../orders) - a generic reuse service
- [common](../common) - a reuse content package
- [SAP Fiori Elements UIs](app)


### Get it

```sh
git clone https://github.com/capire/bookstore
```


### Run

```sh
cds watch bookstore
```


### Reuse

```sh
npm login --scope=@capire --registry=https://npm.pkg.github.com
npm add @capire/bookstore
```

[Learn how to authenticate to GitHub packages.](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)

<details>
  <summary><i> Requires this in your .npmrc: </i></summary>

  ```java
  @capire:registry=https://npm.pkg.github.com
  ```
</details>


### Deploy

See how the app is deployed in [capire/samples](https://github.com/capire/samples/deployments).


## Get Help

- Visit the [*capire* docs](https://cap.cloud.sap) to learn about CAP.
- Especially [*Getting Started in a Nutshell*](https://cap.cloud.sap/docs/get-started/in-a-nutshell).
- Visit our [*SAP Community*](https://answers.sap.com/tags/9f13aee1-834c-4105-8e43-ee442775e5ce) to ask questions.
- Find the full sample set on https://github.com/capire/samples.

## Get Support

In case you have a question, find a bug, or otherwise need support, please use our [community](https://answers.sap.com/tags/9f13aee1-834c-4105-8e43-ee442775e5ce). See the documentation at [https://cap.cloud.sap](https://cap.cloud.sap) for more details about CAP.

## License

Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.