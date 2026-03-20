This repo is a minimalistic code sample illustrating how to use CAP / CDS in combination with SAPUI5 / FEv4.

I use it for trying out features or for reproducing bugs in a minimalistic setup, typically on the latest version of the frameworks, so that I can report them to the framework team.
I document such issues as branches / pull requests against the main branch of my fork. DO NOT CREATE PULL REQUESTS AGAINST THE UPSTREAM!

Never push to the upstream: https://github.com/capire/bookstore
Always push to my fork: https://github.com/PierreFritsch/bookstore
Keep the main branch of my fork up-to-date with the upstream.

The repo maintainers chose to install @sap/cds-dk globally. I prefer installing it locally with the zsh alias `cds=./node_modules/@sap/cds-dk/bin/cds.js`.

If changes are required in @capire/bookshop, apply them locally with `patch-package`.