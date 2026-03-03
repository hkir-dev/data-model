# data-model

A standardized data model specification built with [Bikeshed](https://tabatkins.github.io/bikeshed/).

## Overview

This repository contains a W3C-style specification document that defines a comprehensive data model for consistent data representation and exchange.

## Viewing the Specification

The specification is automatically deployed to GitHub Pages and can be viewed at:
- **Live Specification**: https://hkir-dev.github.io/data-model/

## Building Locally

To build the specification locally:

1. Install Bikeshed:
   ```bash
   pip install bikeshed
   bikeshed update
   ```

2. Build the specification:
   ```bash
   bikeshed spec index.bs index.html
   ```

3. Open `index.html` in your browser to view the generated specification.

## GitHub Actions Deployment

The specification is automatically built and deployed to GitHub Pages using GitHub Actions. The deployment workflow is triggered:

- On release (when a new release is published)
- Manually via workflow dispatch
- On push to the main branch (when `index.bs` or the workflow file changes)

To manually trigger a deployment:
1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy Bikeshed to GitHub Pages" workflow
3. Click "Run workflow"

## Contributing

To contribute to this specification:

1. Edit the `index.bs` file with your changes
2. Test the build locally using bikeshed
3. Commit and push your changes
4. Create a pull request

## License

This specification is maintained by the HKIR Development Team.