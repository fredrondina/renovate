import { load } from 'js-yaml';
import { GlobalConfig } from '../../../config/global';
import { logger } from '../../../logger';
import { regEx } from '../../../util/regex';
import { GitlabTagsDatasource } from '../../datasource/gitlab-tags';
import { replaceReferenceTags } from '../gitlabci/utils';
import type { PackageDependency, PackageFile } from '../types';

type IncludeObj = {
  file: any;
  project: string;
  ref: string;
};

type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

type JSONObject = {
  [x: string]: JSONValue;
};

function extractDepFromIncludeFile(includeObj: IncludeObj): PackageDependency {
  const dep: PackageDependency = {
    datasource: GitlabTagsDatasource.id,
    depName: includeObj.project,
    depType: 'repository',
  };
  if (!includeObj.ref) {
    dep.skipReason = 'unknown-version';
    return dep;
  }
  dep.currentValue = includeObj.ref;
  return dep;
}

function getAllIncludes(data: JSONValue): IncludeObj[] {
  const isEmptyObject = (obj: JSONObject): boolean =>
    Object.keys(obj).length === 0;

  const removeKeyFromObject = (
    obj: JSONObject,
    excludeKey: string
  ): JSONObject => {
    return Object.keys(obj)
      .filter((key) => key !== excludeKey)
      .reduce((cur, key) => Object.assign(cur, { [key]: obj[key] }), {});
  };

  // If data is null, return empty list
  if (data === null) {
    return [];
  }

  // If Array, search each element
  if (Array.isArray(data)) {
    return data.map(getAllIncludes).flat();
  }

  // For objects, check for include key and search child elements of other keys.
  // Empty object have no include or children and return an empty list.
  if (typeof data === 'object') {
    if (isEmptyObject(data)) {
      return [];
    }

    const childrenData = Object.values(removeKeyFromObject(data, 'include'))
      .map(getAllIncludes)
      .flat();

    // Process include key.
    if (data.include) {
      const includes = (
        Array.isArray(data.include) ? data.include : [data.include]
      ) as Array<IncludeObj>;
      childrenData.push(...includes);
    }
    return childrenData;
  }

  // Primitives return empty list
  return [];
}

export function extractPackageFile(content: string): PackageFile | null {
  const deps: PackageDependency[] = [];
  const { platform, endpoint } = GlobalConfig.get();
  try {
    // TODO: fix me (#9610)
    const doc: any = load(replaceReferenceTags(content), {
      json: true,
    });
    const includes = getAllIncludes(doc);
    for (const includeObj of includes) {
      if (includeObj?.file && includeObj.project) {
        const dep = extractDepFromIncludeFile(includeObj);
        if (platform === 'gitlab' && endpoint) {
          dep.registryUrls = [endpoint.replace(regEx(/\/api\/v4\/?/), '')];
        }
        deps.push(dep);
      }
    }
  } catch (err) /* istanbul ignore next */ {
    if (err.stack?.startsWith('YAMLException:')) {
      logger.debug({ err }, 'YAML exception extracting GitLab CI includes');
    } else {
      logger.warn({ err }, 'Error extracting GitLab CI includes');
    }
  }
  if (!deps.length) {
    return null;
  }
  return { deps };
}
