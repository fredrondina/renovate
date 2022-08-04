import is from '@sindresorhus/is';
import type {
  GitlabInclude,
  GitlabIncludeLocal,
  GitlabIncludeProject,
  GitlabPipeline,
} from '../gitlabci/types';

export function isGitlabPipeline(obj: any): obj is GitlabPipeline {
  return is.object(obj) && Object.keys(obj).length !== 0;
}

export function filterIncludeFromGitlabPipeline(
  pipeline: GitlabPipeline
): GitlabPipeline {
  const pipeline_without_include = {};
  for (const key of Object.keys(pipeline).filter((key) => key !== 'include')) {
    Object.assign(pipeline_without_include, {
      [key]: pipeline[key as keyof typeof pipeline],
    });
  }
  return pipeline_without_include as GitlabPipeline;
}

export function isGitlabIncludeProject(
  include: GitlabInclude
): include is GitlabIncludeProject {
  return !is.undefined((include as GitlabIncludeProject).project);
}

export function isGitlabIncludeLocal(
  include: GitlabInclude
): include is GitlabIncludeLocal {
  return !is.undefined((include as GitlabIncludeLocal).local);
}
