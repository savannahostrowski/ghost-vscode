# Release Instructions
- Update the [Changelog](CHANGELOG.md)
- Update the extension version in `package.json`
- Run `git tag v0.0.x`
- Run `git push origin tag`
- The GHA will handle publishing the VSIX to the VS Code Marketplace
    - Azure DevOps PAT will have to be periodically refreshed
