# DevOps Web Project

This project is a CDK TypeScript implementation for a DevOps web application infrastructure.

## Project Overview

The DevOps Web project uses AWS CDK to define and provision cloud infrastructure resources for a web application. It includes components for serverless computing, database management, and CI/CD pipelines.

## Prerequisites

- Node.js (v14.x or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (v2.x)

## Installation

1. Clone the repository:

   ```shell
   git clone https://github.com/your-repo/devops-web.git
   cd devops-web
   ```

2. Install dependencies:

   ```shell
   npm install
   ```

## Usage

### Update the GitHub repository integration

```shell
vi cdk.json
```

### Modify the properties

Example:

- **githubOwner**: animesh303
- **githubRepo**": tactictoe
- **githubBranch**": main
- **githubToken**": Refer to [Generate a GitHub Repository Personal Access Token](#generate-a-github-repository-personal-access-token)

### Deploy the stack

```shell
npx cdk deploy
```

Check the output of the CloudFormation Stack for Website URL.

## Project Structure

- `bin/devops-web.ts`: Entry point for the CDK app
- `lib/devops-web-stack.ts`: Main stack definition

## Useful Commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `npx cdk deploy`  deploy this stack to your default AWS account/region
- `npx cdk diff`    compare deployed stack with current state
- `npx cdk synth`   emits the synthesized CloudFormation template

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Appendix

### Generate a GitHub Repository Personal Access Token

Log in to GitHub: Go to GitHub and log in to your account.

#### Navigate to Developer Settings

In the top right corner, click on your profile picture. Select Settings.
Scroll down and click Developer settings.

#### Create a Personal Access Token

In the left-hand menu, select Personal access tokens > Tokens (classic).
Click on the Generate new token button.

#### Set Token Permissions

**Note:** For AWS CodePipeline, the token must have the following permissions:

- **repo**: Grants access to repositories. This is essential for CodePipeline to read and clone the GitHub repository.
- **admin**: Allows CodePipeline to set up a webhook to trigger the pipeline when new commits are pushed.
***Optionally***, you can set the expiration date for the token.

#### Generate the Token

Once you have set the necessary permissions, click the Generate token button at the bottom of the page.

#### Copy the Token

Once the token is generated, make sure to copy it. You won’t be able to view it again after leaving the page.
