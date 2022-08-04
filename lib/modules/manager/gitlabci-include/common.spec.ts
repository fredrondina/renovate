import { load } from 'js-yaml';
import { Fixtures } from '../../../../test/fixtures';
import type { GitlabPipeline } from '../gitlabci/types';
import { replaceReferenceTags } from '../gitlabci/utils';
import {
  filterIncludeFromGitlabPipeline,
  isGitlabIncludeLocal,
  isGitlabIncludeProject,
} from './common';

const yamlFileMultiConfig = Fixtures.get('gitlab-ci.1.yaml');
const pipeline = load(
  replaceReferenceTags(yamlFileMultiConfig)
) as GitlabPipeline;
const includeLocal = { local: 'something' };
const includeProject = { project: 'something' };

describe('modules/manager/gitlabci-include/common', () => {
  describe('filterIncludeFromGitlabPipeline()', () => {
    it('returns GitlabPipeline without top level include key', () => {
      expect(filterIncludeFromGitlabPipeline(pipeline)).toMatchObject({
        script: [null, null],
      });
    });
  });

  describe('isGitlabIncludeLocal()', () => {
    it('returns true if GitlabInclude is GitlabIncludeLocal', () => {
      expect(isGitlabIncludeLocal(includeLocal)).toBe(true);
    });

    it('returns false if GitlabInclude is not GitlabIncludeLocal', () => {
      expect(isGitlabIncludeLocal(includeProject)).toBe(false);
    });
  });

  describe('isGitlabIncludeProject()', () => {
    it('returns true if GitlabInclude is GitlabIncludeProject', () => {
      expect(isGitlabIncludeProject(includeProject)).toBe(true);
    });

    it('returns false if GitlabInclude is not GitlabIncludeProject', () => {
      expect(isGitlabIncludeProject(includeLocal)).toBe(false);
    });
  });
});
