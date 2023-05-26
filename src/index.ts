import * as core from "@actions/core";
import fs from "fs-extra";
import * as gitUtils from "./gitUtils";
import { runPublish, runVersion } from "./run";
import readChangesetState from "./readChangesetState";

const getOptionalInput = (name: string) => core.getInput(name) || undefined;

(async () => {
  let githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    core.setFailed("Please add the GITHUB_TOKEN to the changesets action");
    return;
  }

  const inputCwd = core.getInput("cwd");
  if (inputCwd) {
    core.info("changing directory to the one given as the input");
    process.chdir(inputCwd);
  }

  let setupGitUser = core.getBooleanInput("setupGitUser");

  if (setupGitUser) {
    core.info("setting git user");
    await gitUtils.setupUser();
  }

  core.info("setting GitHub credentials");
  await fs.writeFile(
    `${process.env.HOME}/.netrc`,
    `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`
  );

  let publishScript = core.getInput("publish");

  let hasPublishScript = !!publishScript;

  const { pullRequestNumber } = await runVersion({
    script: getOptionalInput("version"),
    githubToken,
    prTitle: getOptionalInput("title"),
    commitMessage: getOptionalInput("commit"),
    hasPublishScript,
  });

  core.setOutput("pullRequestNumber", String(pullRequestNumber));

  return;
})().catch((err) => {
  core.error(err);
  core.setFailed(err.message);
});
