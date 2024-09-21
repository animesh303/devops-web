import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";

import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Duration, SecretValue } from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export class WebDevOpsPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = this.account;

    // const githubToken = Context.getValue(this, "githubToken");
    const githubToken = this.node.tryGetContext("githubToken");
    const githubOwner = this.node.tryGetContext("githubOwner");
    const githubRepo = this.node.tryGetContext("githubRepo");
    const githubBranch = this.node.tryGetContext("githubBranch");

    // Create a Secrets Manager secret
    const githubSecret = new Secret(this, `GithubSecret-${githubRepo}`, {
      secretName: `GitHub-Token-${githubRepo}`,
      description: `GitHub personal access token for ${githubRepo}`,
      secretStringValue: SecretValue.plainText(githubToken),
    });

    const bucketName = `webapp-${githubRepo}-${accountId}-${cdk.Aws.REGION}`;
    // Create an S3 bucket for the website
    const websiteBucket = new s3.Bucket(this, "webappBucket", {
      bucketName: bucketName, // Replace with your desired bucket name
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false, // Allow public ACLs
        blockPublicPolicy: false, // Allow public bucket policy
        ignorePublicAcls: false, // Ignore public ACLs
        restrictPublicBuckets: false, // Allow public buckets
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the CodePipeline
    // const pipeline = new codepipeline.Pipeline(this, "webAppPipeline", {
    //   pipelineName: "webAppPipeline",
    // });

    const pipeline = new codepipeline.Pipeline(
      this,
      `WebAppPipeline-${githubRepo}`,
      {
        pipelineName: `webAppPipeline-${githubRepo}`,
      }
    );

    // Add the source stage (GitHub repository)
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: `WebAppSource-${githubRepo}`,
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      oauthToken: cdk.SecretValue.secretsManager(githubSecret.secretName),
      output: sourceOutput,
    });
    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction],
    });

    // Define the Build project
    const buildProject = new codebuild.PipelineProject(
      this,
      `BuildProject-${githubRepo}`,
      {
        projectName: `BuildProject-${githubRepo}`,
        buildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              commands: [
                "npm install", // Install dependencies
              ],
            },
            build: {
              commands: [
                "npm run build", // Build the project, assuming it outputs to the 'build' folder
              ],
            },
          },
          artifacts: {
            "base-directory": "build", // Specify the build output directory
            files: [
              "**/*", // Include all files in the build directory
            ],
          },
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0, // Choose appropriate build image
        },
      }
    );

    // Add the Build stage
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: `Build-${githubRepo}`,
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput], // Output artifact from build
    });
    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction],
    });

    // Add the deploy stage (S3 deployment)

    const deployAction = new codepipeline_actions.S3DeployAction({
      actionName: "WebAppDeploy",
      bucket: websiteBucket,
      input: buildOutput,
    });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction],
    });

    // Create a custom cache policy
    const customCachePolicy = new cloudfront.CachePolicy(
      this,
      "CustomCachePolicy",
      {
        defaultTtl: Duration.minutes(1), // Set the default TTL to 1 minutes
        minTtl: Duration.seconds(1), // Minimum TTL of 1 second
        maxTtl: Duration.minutes(2), // Maximum TTL of 2 minutes
      }
    );

    // Add CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "WebAppDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3StaticWebsiteOrigin(websiteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: customCachePolicy,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, "DistributionURL", {
      value: distribution.distributionDomainName,
      description: "Website URL",
    });
  }
}
